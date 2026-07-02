import { shuffle } from '../utils/shuffle.js';

/**
 * Generate plausible distractors for multiple-choice questions.
 *
 * Strategy (ordered by priority):
 * 1. Same-unit words (most plausible — from same lesson)
 * 2. Same-grade words
 * 3. Same part-of-speech words
 * 4. Random fallback
 *
 * @param {object} targetWord - the correct answer word
 * @param {Array} allWords - full vocabulary array
 * @param {number} count - number of distractors to generate (default 3)
 * @param {string} type - 'en2cn' (return CN) or 'listen' (return EN)
 * @returns {Array<string>} array of distractor strings
 */
export function generateDistractors(targetWord, allWords, count = 3, type = 'en2cn') {
  if (allWords.length <= count) {
    // Not enough words — can't generate proper distractors
    return [];
  }

  const pool = allWords.filter(w => w.id !== targetWord.id);
  let candidates = [];

  // Stage 1: Same-unit words
  const sameUnit = pool.filter(w =>
    w.unit === targetWord.unit && w.grade === targetWord.grade
  );
  candidates.push(...shuffle(sameUnit));

  // Stage 2: Same-grade words
  if (candidates.length < count) {
    const sameGrade = pool.filter(w =>
      w.grade === targetWord.grade && !candidates.includes(w)
    );
    candidates.push(...shuffle(sameGrade));
  }

  // Stage 3: Same part-of-speech
  if (candidates.length < count) {
    const samePOS = pool.filter(w =>
      w.pos === targetWord.pos && !candidates.includes(w)
    );
    candidates.push(...shuffle(samePOS));
  }

  // Stage 4: For 'listen' type, prefer similar-length words
  if (type === 'listen' && candidates.length > count) {
    candidates.sort((a, b) => {
      const aDiff = Math.abs(a.en.length - targetWord.en.length);
      const bDiff = Math.abs(b.en.length - targetWord.en.length);
      return aDiff - bDiff;
    });
  }

  // Stage 5: Random fallback
  if (candidates.length < count) {
    const random = pool.filter(w => !candidates.includes(w));
    candidates.push(...shuffle(random));
  }

  // Take top `count`
  const selected = candidates.slice(0, count);

  // Map to display strings
  return selected.map(w => type === 'listen' ? w.en : w.cn);
}
