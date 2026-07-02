import * as db from '../db.js';
import { getPreviousLevel, getLevelKeys, getLevelKeysByGrade } from './vocab.js';

let progressCache = {};

/**
 * Load all progress from IndexedDB into memory.
 */
export async function init() {
  const all = await db.getAll('progress');
  progressCache = {};
  for (const p of all) {
    progressCache[p.levelKey] = p;
  }
}

/**
 * Get progress for a level (synchronous, from cache).
 */
export function get(levelKey) {
  return progressCache[levelKey] || null;
}

/**
 * Save progress for a level.
 */
export async function save(levelKey, data) {
  progressCache[levelKey] = { ...data, levelKey };
  await db.put('progress', progressCache[levelKey]);
}

/**
 * Check if a level is unlocked.
 * First level (g6-u1-g1) is always unlocked.
 * Otherwise, the previous level must have at least 1 star.
 */
export function isUnlocked(levelKey) {
  if (levelKey === getLevelKeys()[0]) return true;
  const prevKey = getPreviousLevel(levelKey);
  if (!prevKey) return true;
  const prev = get(prevKey);
  return prev && prev.stars >= 1;
}

/**
 * Get the first unlocked but not-yet-completed level for a grade.
 * Falls back to first level of grade.
 */
export function getCurrentLevel(grade) {
  // Simplified: return first incomplete, or first unlocked
  const keys = getLevelKeysByGrade(grade);
  for (const k of keys) {
    if (!isUnlocked(k)) continue;
    const p = get(k);
    if (!p || p.stars < 3) return k;
  }
  return keys[0] || null;
}

/**
 * Get summary stats.
 */
export function getStats() {
  const all = Object.values(progressCache);
  const completed = all.filter(p => p.completed);
  const totalStars = completed.reduce((s, p) => s + (p.stars || 0), 0);
  const totalXP = all.reduce((s, p) => s + (p.bestXP || 0), 0);
  const masteryCount = all.reduce((s, p) => {
    if (!p.wordResults) return s;
    return s + Object.values(p.wordResults).filter(r => r.correct > r.wrong).length;
  }, 0);

  // Per-grade completion
  const gradeCompletions = {};
  for (const p of completed) {
    const match = p.levelKey.match(/^g(\d+)/);
    if (match) {
      const g = parseInt(match[1]);
      gradeCompletions[g] = (gradeCompletions[g] || 0) + 1;
    }
  }

  return {
    levelsCompleted: completed.length,
    totalStars,
    totalXP,
    masteryCount,
    hasPerfectLevel: completed.some(p => p.bestScore === 100),
    longestStreak: 0, // filled from checkin
    gradeCompletions
  };
}

/**
 * Get all progress entries for a grade.
 */
export function getByGrade(grade) {
  return Object.values(progressCache).filter(p => {
    const match = p.levelKey.match(/^g(\d+)/);
    return match && parseInt(match[1]) === grade;
  });
}
