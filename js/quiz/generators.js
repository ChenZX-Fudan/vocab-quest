import { shuffle } from '../utils/shuffle.js';
import { generateDistractors } from './distractors.js';
import { getAllWords } from '../models/vocab.js';

/**
 * Generate a question object for a given word and type.
 * Each generator returns: { type, wordId, prompt, correctAnswer, options?, audioText?, sentenceHint?, hint? }
 */

/**
 * EN → CN multiple choice
 */
export function generateEn2Cn(word) {
  const allWords = getAllWords();
  const distractors = generateDistractors(word, allWords, 3, 'en2cn');
  const options = shuffle([word.cn, ...distractors]);

  return {
    type: 'en2cn',
    wordId: word.id,
    prompt: word.en,
    correctAnswer: word.cn,
    options,
    pronunciation: word.pronunciation
  };
}

/**
 * CN → EN spelling (input type)
 */
export function generateCn2En(word) {
  // Build hint: first letter + asterisks
  const firstLetter = word.en[0];
  const rest = word.en.slice(1).replace(/[a-zA-Z]/g, '*');
  const hint = firstLetter + rest;

  return {
    type: 'cn2en',
    wordId: word.id,
    prompt: word.cn,
    correctAnswer: word.en,
    hint,
    options: null // text input
  };
}

/**
 * Listen & choose (TTS audio + 4 English word options)
 */
export function generateListen(word) {
  const allWords = getAllWords();
  const distractors = generateDistractors(word, allWords, 3, 'listen');
  const options = shuffle([word.en, ...distractors]);

  return {
    type: 'listen',
    wordId: word.id,
    prompt: '请听发音，选择对应的单词',
    correctAnswer: word.en,
    options,
    audioText: word.en
  };
}

/**
 * Word form (derived word)
 * e.g., "happy → _______ (adverb)"  answer: "happily"
 */
export function generateWordForm(word) {
  if (!word.derivedForms || word.derivedForms.length === 0) {
    return null; // Skip — no derived forms available
  }

  // Pick a random derived form
  const form = word.derivedForms[Math.floor(Math.random() * word.derivedForms.length)];

  const prompt = `${word.en} → _______ (${form.type})`;

  return {
    type: 'wordForm',
    wordId: word.id,
    prompt,
    correctAnswer: form.form,
    hint: form.type,
    options: null // text input
  };
}

/**
 * Cloze (fill in the blank in a sentence)
 */
export function generateCloze(word) {
  if (!word.sentence || !word.sentence.toLowerCase().includes(word.en.toLowerCase())) {
    return null; // Skip — sentence doesn't contain the word
  }

  // Replace the word in the sentence with a blank
  const regex = new RegExp(word.en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  const prompt = word.sentence.replace(regex, '_______');

  // For cloze, use multiple choice (easier for younger students)
  // Get distractors for the blank
  const allWords = getAllWords();
  const distractors = generateDistractors(word, allWords, 3, 'listen');
  const options = shuffle([word.en, ...distractors]);

  return {
    type: 'cloze',
    wordId: word.id,
    prompt,
    correctAnswer: word.en,
    sentenceHint: word.sentenceCn,
    options
  };
}

/**
 * Generate a set of questions for a list of words.
 * Uses weighted random question type selection.
 */
export function generateQuestionSet(words, typeWeights, enabledTypes) {
  const questions = [];

  for (const word of words) {
    // Pick a question type based on weights
    const type = pickQuestionType(word, typeWeights, enabledTypes);
    if (!type) continue;

    let question = null;
    switch (type) {
      case 'en2cn':
        question = generateEn2Cn(word);
        break;
      case 'cn2en':
        question = generateCn2En(word);
        break;
      case 'listen':
        question = generateListen(word);
        break;
      case 'wordForm':
        question = generateWordForm(word);
        break;
      case 'cloze':
        question = generateCloze(word);
        break;
    }

    if (question) {
      questions.push(question);
    }
  }

  // If some words couldn't generate their assigned type (e.g., no derived forms),
  // fall back to en2cn
  if (questions.length < words.length) {
    // Already generated questions cover the words that worked
  }

  return shuffle(questions);
}

/**
 * Pick a question type for a word based on weighted probabilities.
 * Skips types that aren't applicable to the word.
 */
function pickQuestionType(word, typeWeights, enabledTypes) {
  // Filter to enabled types only
  let available = Object.entries(typeWeights)
    .filter(([type]) => enabledTypes.includes(type))
    .filter(([type]) => {
      // Filter out types that won't work for this word
      if (type === 'wordForm' && (!word.derivedForms || word.derivedForms.length === 0)) return false;
      if (type === 'cloze' && (!word.sentence || !word.sentence.toLowerCase().includes(word.en.toLowerCase()))) return false;
      return true;
    });

  if (available.length === 0) {
    // Fallback: always try en2cn
    available = [['en2cn', 1]];
  }

  // Weighted random selection
  const totalWeight = available.reduce((sum, [, w]) => sum + w, 0);
  let rand = Math.random() * totalWeight;

  for (const [type, weight] of available) {
    rand -= weight;
    if (rand <= 0) return type;
  }

  return available[0][0];
}
