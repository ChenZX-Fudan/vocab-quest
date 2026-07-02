import { shuffle } from './shuffle.js';

/**
 * Randomly sample `count` items from an array.
 * Uses Fisher-Yates partial shuffle for efficiency.
 */
export function randomSample(arr, count) {
  if (count >= arr.length) return shuffle(arr);
  const shuffled = shuffle(arr);
  return shuffled.slice(0, count);
}

/**
 * Weighted random sample. Uses cumulative weights.
 * Returns `count` items without replacement, probability proportional to weightFn(item).
 */
export function weightedSample(arr, count, weightFn) {
  if (count >= arr.length) return shuffle(arr);

  const items = arr.map((item, i) => ({ item, weight: weightFn(item, i), origIdx: i }));
  const totalWeight = items.reduce((sum, it) => sum + it.weight, 0);

  const result = [];
  const remaining = [...items];
  let remainingWeight = totalWeight;

  for (let k = 0; k < count; k++) {
    let rand = Math.random() * remainingWeight;
    let idx = 0;
    for (let i = 0; i < remaining.length; i++) {
      rand -= remaining[i].weight;
      if (rand <= 0) {
        idx = i;
        break;
      }
    }
    result.push(remaining[idx].item);
    remainingWeight -= remaining[idx].weight;
    remaining.splice(idx, 1);
  }

  return result;
}
