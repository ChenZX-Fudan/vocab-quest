import * as db from '../db.js';
import { getWordById } from './vocab.js';

let errorCount = 0;

/**
 * Initialize — just count current errors for quick display.
 */
export async function init() {
  const all = await db.getAll('errors');
  errorCount = all.length;
}

/**
 * Record a wrong answer (called from quiz engine).
 */
export async function recordError(wordId, errorEntry) {
  const existing = await db.get('errors', wordId);

  if (existing) {
    // Add error to history (keep last 20)
    existing.errorHistory.unshift(errorEntry);
    if (existing.errorHistory.length > 20) existing.errorHistory.pop();

    // Penalize: halve interval, reduce ease
    existing.interval = Math.max(1, Math.floor(existing.interval * 0.5));
    existing.ease = Math.max(1.3, existing.ease - 0.2);
    existing.repetitions = 0;
    existing.nextReviewAt = Date.now() + existing.interval * 86400000;
    existing.mastered = false;

    await db.put('errors', existing);
  } else {
    // New error entry
    const word = getWordById(wordId);
    if (!word) return;

    await db.put('errors', {
      wordId,
      word: {
        id: word.id,
        en: word.en,
        cn: word.cn,
        pronunciation: word.pronunciation,
        sentence: word.sentence,
        sentenceCn: word.sentenceCn,
        pos: word.pos,
        grade: word.grade,
        unit: word.unit
      },
      errorHistory: [errorEntry],
      interval: 0,
      ease: 2.5,
      repetitions: 0,
      nextReviewAt: Date.now(), // due immediately
      lastReviewAt: 0,
      mastered: false
    });
  }

  errorCount = (await db.getAll('errors')).length;
}

/**
 * Mark a review as correct (SM-2 correct response).
 */
export async function reviewCorrect(wordId) {
  const entry = await db.get('errors', wordId);
  if (!entry) return;

  entry.lastReviewAt = Date.now();

  if (entry.repetitions === 0) {
    entry.interval = 1;
  } else if (entry.repetitions === 1) {
    entry.interval = 3;
  } else {
    entry.interval = Math.round(entry.interval * entry.ease);
  }

  entry.repetitions++;

  // Cap at 180 days
  if (entry.interval > 180) entry.interval = 180;

  entry.nextReviewAt = Date.now() + entry.interval * 86400000;

  // Mastered after 5+ correct reviews and interval >= 21 days
  if (entry.repetitions >= 5 && entry.interval >= 21) {
    entry.mastered = true;
  }

  await db.put('errors', entry);
}

/**
 * Mark a review as wrong.
 */
export async function reviewWrong(wordId) {
  const entry = await db.get('errors', wordId);
  if (!entry) return;

  entry.lastReviewAt = Date.now();
  entry.interval = Math.max(1, Math.floor(entry.interval * 0.5));
  entry.ease = Math.max(1.3, entry.ease - 0.15);
  entry.repetitions = 0;
  entry.nextReviewAt = Date.now() + entry.interval * 86400000;

  await db.put('errors', entry);
}

/**
 * Get words due for review (nextReviewAt <= now, not mastered).
 */
export async function getDueReviews(limit = 20) {
  const all = await db.getAll('errors');
  const now = Date.now();
  const due = all
    .filter(e => !e.mastered && e.nextReviewAt <= now)
    .sort((a, b) => a.nextReviewAt - b.nextReviewAt)
    .slice(0, limit);
  return due;
}

/**
 * Get all error words (for the errors screen).
 */
export async function getAllErrors(sortBy = 'recent') {
  const all = await db.getAll('errors');

  if (sortBy === 'recent') {
    return all.sort((a, b) =>
      (b.errorHistory[0]?.at || 0) - (a.errorHistory[0]?.at || 0)
    );
  }
  if (sortBy === 'due') {
    return all
      .filter(e => !e.mastered)
      .sort((a, b) => a.nextReviewAt - b.nextReviewAt);
  }
  if (sortBy === 'count') {
    return all.sort((a, b) => b.errorHistory.length - a.errorHistory.length);
  }
  return all;
}

/**
 * Get total error count (for badges/home screen).
 */
export function getErrorCount() {
  return errorCount;
}

/**
 * Get mastered count.
 */
export async function getMasteredCount() {
  const all = await db.getAll('errors');
  return all.filter(e => e.mastered).length;
}

/**
 * Get due count for today.
 */
export async function getDueCount() {
  const all = await db.getAll('errors');
  const now = Date.now();
  return all.filter(e => !e.mastered && e.nextReviewAt <= now).length;
}
