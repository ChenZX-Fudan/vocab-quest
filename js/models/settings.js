import * as db from '../db.js';

// Default settings
const DEFAULTS = {
  ttsRate: 0.9,
  ttsVoice: '',
  theme: 'light',
  soundEnabled: true,
  questionTypes: ['en2cn', 'cn2en', 'listen', 'wordForm', 'cloze'],
  typeWeights: {
    en2cn: 30,
    cn2en: 25,
    listen: 15,
    wordForm: 20,
    cloze: 10
  }
};

let settingsCache = { ...DEFAULTS };

/**
 * Load settings from DB, filling in defaults for missing keys.
 */
export async function init() {
  const all = await db.getAll('settings');
  settingsCache = { ...DEFAULTS };
  for (const s of all) {
    settingsCache[s.key] = s.value;
  }
}

/**
 * Get a setting value.
 */
export function get(key) {
  return settingsCache[key] ?? DEFAULTS[key];
}

/**
 * Set a setting value (persisted to DB).
 */
export async function set(key, value) {
  settingsCache[key] = value;
  await db.put('settings', { key, value });
}

/**
 * Get all settings.
 */
export function getAll() {
  return { ...settingsCache };
}

/**
 * Reset all settings to defaults.
 */
export async function resetAll() {
  settingsCache = { ...DEFAULTS };
  await db.clear('settings');
  // Re-insert defaults
  const entries = Object.entries(DEFAULTS).map(([key, value]) => ({ key, value }));
  await db.putAll('settings', entries);
}
