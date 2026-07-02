/**
 * Calculate quiz results from the answers array.
 *
 * @param {Array} answers - array of { wordId, type, correct, userAnswer, correctAnswer, timeMs }
 * @param {string} levelKey - the level identifier
 * @returns {object} results object
 */
export function calculateResult(answers, levelKey) {
  const total = answers.length;
  const correct = answers.filter(a => a.correct).length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  // Base XP: 10 per correct answer
  const baseXP = correct * 10;

  // Streak bonus: consecutive correct answers in this session
  let streakBonus = 0;
  let currentStreak = 0;
  for (const a of answers) {
    if (a.correct) {
      currentStreak++;
    } else {
      if (currentStreak >= 3) streakBonus += currentStreak * 2;
      currentStreak = 0;
    }
  }
  if (currentStreak >= 3) streakBonus += currentStreak * 2;

  // Speed bonus: fast correct answers (< 5s = bonus)
  const speedBonus = answers
    .filter(a => a.correct && a.timeMs < 5000)
    .reduce((sum, a) => sum + Math.max(0, 5 - Math.floor(a.timeMs / 1000)), 0);

  const totalXP = baseXP + streakBonus + speedBonus;

  // Star thresholds
  const stars = accuracy >= 90 ? 3 : accuracy >= 70 ? 2 : accuracy >= 50 ? 1 : 0;

  return {
    levelKey: levelKey || 'review',
    totalQuestions: total,
    correctCount: correct,
    accuracy,
    baseXP,
    streakBonus,
    speedBonus,
    totalXP,
    stars,
    answers,
    completedAt: Date.now()
  };
}
