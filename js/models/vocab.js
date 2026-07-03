import { grade6Words, grade7Words, grade8Words, grade9Words, grade6ExamWords, grade7ExamWords, grade8ExamWords } from '../../data/index.js';

let allWords = [];
let wordsById = {};
let wordsByLevel = {};
let levelKeys = [];

/**
 * Initialize vocabulary in memory.
 */
export function init() {
  allWords = [
    ...grade6Words, ...grade7Words, ...grade8Words, ...grade9Words,
    ...grade6ExamWords, ...grade7ExamWords, ...grade8ExamWords
  ];

  wordsById = {};
  for (const w of allWords) {
    wordsById[w.id] = w;
  }

  wordsByLevel = {};
  for (const w of allWords) {
    const key = levelKey(w);
    if (!wordsByLevel[key]) wordsByLevel[key] = [];
    wordsByLevel[key].push(w);
  }

  levelKeys = Object.keys(wordsByLevel).sort((a, b) => {
    const [ga, ua, gpa] = parseLevelKey(a);
    const [gb, ub, gpb] = parseLevelKey(b);
    return ga - gb || ua - ub || gpa - gpb;
  });
}

/**
 * Build level key from word: "g{grade}-u{unit}-g{group}"
 */
export function levelKey(word) {
  return `g${word.grade}-u${word.unit}-g${word.group}`;
}

/**
 * Parse "g7-u1-g1" → [7, 1, 1]
 */
export function parseLevelKey(key) {
  const m = key.match(/^g(\d+)-u(\d+)-g(\d+)$/);
  if (!m) return [0, 0, 0];
  return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])];
}

/**
 * Get the grade name string.
 */
export function getGradeName(grade) {
  const map = { 6: '六年级', 7: '七年级', 8: '八年级', 9: '九年级' };
  return map[grade] || `${grade}年级`;
}

/**
 * Get all words.
 */
export function getAllWords() {
  return allWords;
}

/**
 * Get a word by its ID.
 */
export function getWordById(id) {
  return wordsById[id] || null;
}

/**
 * Get all words for a given level.
 */
export function getWordsByLevel(key) {
  return wordsByLevel[key] || [];
}

/**
 * Get all words for a given grade.
 */
export function getWordsByGrade(grade) {
  return allWords.filter(w => w.grade === grade);
}

/**
 * Get all level keys in order.
 */
export function getLevelKeys() {
  return levelKeys;
}

/**
 * Get level keys for a specific grade.
 */
export function getLevelKeysByGrade(grade) {
  return levelKeys.filter(k => {
    const [g] = parseLevelKey(k);
    return g === grade;
  });
}

/**
 * Get the distinct grades present in the data.
 */
export function getAvailableGrades() {
  const grades = new Set(allWords.map(w => w.grade));
  return [...grades].sort();
}

/**
 * Get the previous level key in sequence.
 */
export function getPreviousLevel(key) {
  const idx = levelKeys.indexOf(key);
  if (idx <= 0) return null;
  return levelKeys[idx - 1];
}

/**
 * Get the next level key in sequence.
 */
export function getNextLevel(key) {
  const idx = levelKeys.indexOf(key);
  if (idx < 0 || idx >= levelKeys.length - 1) return null;
  return levelKeys[idx + 1];
}

/**
 * Get level display label.
 */
export function getLevelLabel(key) {
  const [, unit, group] = parseLevelKey(key);
  if (unit === 99) return `考纲-${group === 1 ? 'A' : 'B'}`;
  return `Unit ${unit}-${group === 1 ? 'A' : 'B'}`;
}

/**
 * Get the total number of levels per grade.
 */
export function getLevelCountByGrade() {
  const counts = {};
  for (const k of levelKeys) {
    const [g] = parseLevelKey(k);
    counts[g] = (counts[g] || 0) + 1;
  }
  return counts;
}

/**
 * Get total word count.
 */
export function getTotalWordCount() {
  return allWords.length;
}
