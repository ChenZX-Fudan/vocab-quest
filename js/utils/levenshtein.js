/**
 * Compute Levenshtein (edit) distance between two strings.
 * Used for fuzzy spelling tolerance.
 */
export function levenshteinDistance(a, b) {
  const alen = a.length;
  const blen = b.length;

  // Quick wins
  if (alen === 0) return blen;
  if (blen === 0) return alen;

  // Use single-row DP for memory efficiency
  let prev = new Array(blen + 1);
  let curr = new Array(blen + 1);

  for (let j = 0; j <= blen; j++) prev[j] = j;

  for (let i = 1; i <= alen; i++) {
    curr[0] = i;
    for (let j = 1; j <= blen; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,       // deletion
        curr[j - 1] + 1,   // insertion
        prev[j - 1] + cost // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }

  return prev[blen];
}

/**
 * Check if user's spelling answer is close enough.
 * - Case-insensitive exact match: always true
 * - Words > 5 chars: allow Levenshtein distance of 1
 * - Words <= 5 chars: require exact match
 */
export function isSpellingCorrect(userAnswer, correctAnswer) {
  const user = userAnswer.trim().toLowerCase();
  const correct = correctAnswer.trim().toLowerCase();

  if (user === correct) return true;

  if (correct.length > 5) {
    return levenshteinDistance(user, correct) <= 1;
  }

  return false;
}
