import { get as getSetting } from '../models/settings.js';

const TTS = {
  _synth: null,
  _voice: null,
  _rate: 0.9,
  _initialized: false,
  _playing: false,

  /**
   * Initialize TTS. Must be called after a user gesture on iOS.
   */
  init() {
    if (this._initialized) return;
    this._synth = window.speechSynthesis;

    // Warm up the synthesizer (iOS fix)
    try {
      const dummy = new SpeechSynthesisUtterance('');
      dummy.volume = 0;
      this._synth.speak(dummy);
    } catch (e) {
      // Ignore
    }

    this._rate = getSetting('ttsRate') || 0.9;
    this._initialized = true;
  },

  /**
   * Load preferred voice from settings.
   */
  async loadVoice() {
    const voiceSetting = getSetting('ttsVoice');
    if (!voiceSetting) return;

    await this._waitForVoices();
    const voices = this._synth.getVoices();
    this._voice = voices.find(v => v.name === voiceSetting) || null;
  },

  _waitForVoices() {
    return new Promise(resolve => {
      const voices = this._synth.getVoices();
      if (voices.length > 0) return resolve();
      this._synth.onvoiceschanged = () => resolve();
    });
  },

  /**
   * Speak text. Returns a promise that resolves when done.
   */
  speak(text) {
    return new Promise((resolve) => {
      if (!this._synth) {
        resolve();
        return;
      }

      // Cancel any ongoing speech
      this._synth.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      if (this._voice) utterance.voice = this._voice;
      utterance.rate = this._rate;
      utterance.lang = 'en-US';
      utterance.volume = 1;

      this._playing = true;

      utterance.onend = () => {
        this._playing = false;
        resolve();
      };

      utterance.onerror = () => {
        this._playing = false;
        resolve();
      };

      // Chrome timeout workaround: pause/resume periodically for long text
      if (text.length > 50) {
        const pingInterval = setInterval(() => {
          if (!this._playing) {
            clearInterval(pingInterval);
            return;
          }
          this._synth.pause();
          this._synth.resume();
        }, 10000);

        utterance.onend = () => {
          clearInterval(pingInterval);
          this._playing = false;
          resolve();
        };
      }

      this._synth.speak(utterance);
    });
  },

  /**
   * Check if currently speaking.
   */
  isPlaying() {
    return this._playing;
  },

  /**
   * Cancel current speech.
   */
  cancel() {
    if (this._synth) {
      this._synth.cancel();
      this._playing = false;
    }
  },

  /**
   * Get available English voices.
   */
  getVoices() {
    if (!this._synth) return [];
    return this._synth.getVoices().filter(v => v.lang.startsWith('en'));
  },

  /**
   * Set speech rate.
   */
  setRate(rate) {
    this._rate = rate;
  },

  /**
   * Set voice by name.
   */
  setVoice(voiceName) {
    if (!this._synth) return;
    const voices = this._synth.getVoices();
    this._voice = voices.find(v => v.name === voiceName) || null;
  }
};

export { TTS };
