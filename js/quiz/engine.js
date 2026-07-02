import { getWordsByLevel } from '../models/vocab.js';
import { getDueReviews, recordError, reviewCorrect } from '../models/errors.js';
import { get as getProgress, save as saveProgress, getStats } from '../models/progress.js';
import { get as getSetting } from '../models/settings.js';
import { checkAndAward } from '../models/achievements.js';
import { updateLeaderboardStats } from '../models/checkin.js';
import { generateQuestionSet } from './generators.js';
import { calculateResult } from './scoring.js';
import { isSpellingCorrect } from '../utils/levenshtein.js';
import { getLevelCountByGrade } from '../models/vocab.js';

/**
 * QuizSession — manages a single quiz attempt.
 *
 * Lifecycle:
 *   1. init()     — load words, generate questions
 *   2. User answers → submitAnswer()
 *   3. nextQuestion() — advance to next question
 *   4. When all done → getResults() → save progress
 */
export class QuizSession {
  constructor(levelKey) {
    this.levelKey = levelKey;      // e.g., "g7-u1-g1", null for review
    this.isReview = !levelKey || levelKey === 'review';
    this.words = [];
    this.questions = [];
    this.currentIndex = 0;
    this.answers = [];
    this.results = null;
  }

  /**
   * Initialize the session: load words and generate questions.
   */
  async init() {
    if (this.isReview) {
      // Review mode: load due error words
      const dueEntries = await getDueReviews(15);
      if (dueEntries.length === 0) {
        throw new Error('没有需要复习的单词！太棒了！');
      }
      // Build word objects from error entries
      this.words = dueEntries.map(e => ({
        ...e.word,
        _errorEntry: e // keep reference for SM-2 update
      }));
    } else {
      // Normal mode: load words for this level
      this.words = getWordsByLevel(this.levelKey);
      if (this.words.length === 0) {
        throw new Error('该关卡没有单词数据');
      }
    }

    // Get settings
    const typeWeights = getSetting('typeWeights') || {
      en2cn: 30, cn2en: 25, listen: 15, wordForm: 20, cloze: 10
    };
    const enabledTypes = getSetting('questionTypes') || ['en2cn', 'cn2en', 'listen', 'wordForm', 'cloze'];

    // Pick a subset of words (max 12 per quiz)
    const wordCount = Math.min(this.words.length, 12);
    const selectedWords = this._selectWords(wordCount);

    // Generate questions
    this.questions = generateQuestionSet(selectedWords, typeWeights, enabledTypes);

    if (this.questions.length === 0) {
      throw new Error('无法生成题目，请检查题型设置');
    }
  }

  /**
   * Get the current question.
   */
  getCurrentQuestion() {
    if (this.currentIndex >= this.questions.length) return null;
    return this.questions[this.currentIndex];
  }

  /**
   * Submit an answer for the current question.
   */
  submitAnswer(userAnswer, timeMs) {
    const q = this.getCurrentQuestion();
    if (!q) return null;

    let correct = false;

    switch (q.type) {
      case 'en2cn':
      case 'listen':
        // Exact match for multiple choice
        correct = userAnswer === q.correctAnswer;
        break;

      case 'cn2en':
      case 'wordForm':
      case 'cloze':
        // For text input, use fuzzy matching for spelling
        correct = isSpellingCorrect(userAnswer, q.correctAnswer);
        break;

      default:
        correct = userAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
    }

    const answer = {
      qIndex: this.currentIndex,
      wordId: q.wordId,
      type: q.type,
      correct,
      userAnswer,
      correctAnswer: q.correctAnswer,
      timeMs
    };

    this.answers.push(answer);

    // Record error for wrong answers
    if (!correct) {
      recordError(q.wordId, {
        type: q.type,
        userAnswer,
        correctAnswer: q.correctAnswer,
        at: Date.now()
      }).catch(console.error);
    } else if (this.isReview) {
      // In review mode, correct answers update SM-2
      const word = this.words.find(w => w._errorEntry?.wordId === q.wordId);
      if (word?._errorEntry) {
        reviewCorrect(q.wordId).catch(console.error);
      }
    }

    return answer;
  }

  /**
   * Advance to the next question.
   */
  nextQuestion() {
    this.currentIndex++;
  }

  /**
   * Check if the quiz is complete.
   */
  isComplete() {
    return this.currentIndex >= this.questions.length;
  }

  /**
   * Get final results and persist progress.
   */
  getResults() {
    if (this.results) return this.results;

    this.results = calculateResult(this.answers, this.levelKey);

    // Persist progress (for normal mode)
    if (!this.isReview) {
      this._saveProgress();
    }

    return this.results;
  }

  /**
   * Select words for this quiz session.
   * Prefers words the user has struggled with in the past.
   */
  _selectWords(count) {
    // If review mode, just shuffle
    if (this.isReview) {
      return this.words.slice(0, count);
    }

    const existing = getProgress(this.levelKey);
    const wordResults = existing?.wordResults || {};

    // Sort: words with worse performance first
    const sorted = [...this.words].sort((a, b) => {
      const aStats = wordResults[a.id];
      const bStats = wordResults[b.id];

      // Un-attempted words first (need practice)
      if (!aStats && bStats) return -1;
      if (aStats && !bStats) return 1;
      if (!aStats && !bStats) return 0;

      // Then by wrong ratio
      const aRatio = aStats.wrong / Math.max(1, aStats.correct + aStats.wrong);
      const bRatio = bStats.wrong / Math.max(1, bStats.correct + bStats.wrong);
      return bRatio - aRatio;
    });

    // Take first `count`, then shuffle for variety
    const selected = sorted.slice(0, count);
    // Simple Fisher-Yates on the selected set
    for (let i = selected.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [selected[i], selected[j]] = [selected[j], selected[i]];
    }

    return selected;
  }

  /**
   * Save progress to IndexedDB after quiz completion.
   */
  async _saveProgress() {
    const existing = getProgress(this.levelKey) || {
      levelKey: this.levelKey,
      bestScore: 0,
      bestXP: 0,
      stars: 0,
      attempts: 0,
      completed: false,
      wordResults: {}
    };

    const { accuracy, totalXP, stars, answers } = this.results;

    // Update bests
    existing.attempts = (existing.attempts || 0) + 1;
    existing.lastAttemptAt = Date.now();

    if (accuracy > existing.bestScore) {
      existing.bestScore = accuracy;
    }
    if (totalXP > (existing.bestXP || 0)) {
      existing.bestXP = totalXP;
    }
    if (stars > (existing.stars || 0)) {
      existing.stars = stars;
    }
    if (stars >= 1) {
      existing.completed = true;
    }

    // Update per-word stats
    if (!existing.wordResults) existing.wordResults = {};
    for (const a of answers) {
      if (!existing.wordResults[a.wordId]) {
        existing.wordResults[a.wordId] = { correct: 0, wrong: 0 };
      }
      if (a.correct) {
        existing.wordResults[a.wordId].correct++;
      } else {
        existing.wordResults[a.wordId].wrong++;
      }
    }

    await saveProgress(this.levelKey, existing);

    // Update leaderboard
    const stats = getStats();
    stats.gradeLevelsTotal = getLevelCountByGrade();
    stats.totalXP = totalXP;

    await updateLeaderboardStats(stats);

    // Check achievements
    await checkAndAward(stats);
  }
}
