import { router } from '../router.js';
import { setTitle, setBackButton } from '../components/navbar.js';
import { QuizSession } from '../quiz/engine.js';
import { TTS } from '../components/tts.js';
import * as vocab from '../models/vocab.js';

export default class QuizScreen {
  constructor() {
    this.session = null;
    this.answered = false;
    this.startTime = 0;
  }

  async render(container, params) {
    setBackButton(true);

    const levelKey = params.levelKey;
    const isReview = !levelKey || levelKey === 'review';

    if (isReview) {
      setTitle('错题复习');
    } else {
      const label = vocab.getLevelLabel(levelKey);
      const [, unit] = vocab.parseLevelKey(levelKey);
      const gradeName = vocab.getGradeName(parseInt(params.levelKey?.match(/^g(\d+)/)?.[1] || 6));
      setTitle(`${gradeName} Unit ${unit}`);
    }

    try {
      this.session = new QuizSession(levelKey);
      await this.session.init();
    } catch (e) {
      container.innerHTML = `
        <div class="screen">
          <div class="empty-state">
            <div class="empty-state-icon">😅</div>
            <div class="empty-state-text">${e.message || '无法开始答题'}</div>
            <button class="btn btn-primary mt-md" onclick="window.location.hash='#/map'">返回地图</button>
          </div>
        </div>
      `;
      return;
    }

    this.answered = false;
    this._renderQuestion(container);
  }

  _renderQuestion(container) {
    const q = this.session.getCurrentQuestion();
    if (!q) {
      this._finish(container);
      return;
    }

    const total = this.session.questions.length;
    const current = this.session.currentIndex + 1;
    const progressPct = Math.round((current / total) * 100);
    this.startTime = Date.now();
    this.answered = false;

    let typeLabel = '';
    switch (q.type) {
      case 'en2cn': typeLabel = '📖 英译中'; break;
      case 'cn2en': typeLabel = '✏️ 中译英'; break;
      case 'listen': typeLabel = '🎧 听音选词'; break;
      case 'wordForm': typeLabel = '🔄 词形变化'; break;
      case 'cloze': typeLabel = '📝 完形填空'; break;
    }

    container.innerHTML = `
      <div class="screen quiz-container">
        <!-- Progress -->
        <div class="quiz-progress">
          <div class="progress-bar">
            <div class="progress-bar-fill" style="width:${progressPct}%"></div>
          </div>
          <span class="quiz-progress-count">${current}/${total}</span>
        </div>

        <!-- Question Card -->
        <div class="quiz-question-card">
          <div class="quiz-question-type">${typeLabel}</div>

          ${q.type === 'listen' ? `
            <button class="quiz-tts-btn" id="btn-tts" title="点击播放">🔊</button>
          ` : ''}

          <div class="quiz-prompt ${q.type === 'en2cn' || q.type === 'listen' ? 'en-word' : 'cn-word'}">
            ${this._getPromptHTML(q)}
          </div>

          ${q.sentenceHint ? `
            <div class="quiz-sentence-hint">💡 ${q.sentenceHint}</div>
          ` : ''}

          ${q.hint ? `
            <div class="quiz-hint">
              <span>提示：</span>
              <span class="hint-letters">${q.hint}</span>
            </div>
          ` : ''}

          ${this._getAnswerAreaHTML(q)}
        </div>

        <!-- Feedback -->
        <div class="quiz-feedback" id="quiz-feedback"></div>

        <!-- Next Button (hidden until answered) -->
        <button class="btn btn-primary btn-lg quiz-next-btn hidden" id="btn-next">
          下一题 →
        </button>
      </div>
    `;

    // Bind events
    this._bindEvents(container, q);

    // Auto-play TTS for listen type
    if (q.type === 'listen') {
      setTimeout(() => TTS.speak(q.audioText), 300);
    }
  }

  _getPromptHTML(q) {
    switch (q.type) {
      case 'en2cn':
        return q.prompt; // English word
      case 'cn2en':
        return `<div>${q.prompt}</div>`; // Chinese
      case 'listen':
        return `<div style="font-size:var(--font-sm);color:var(--text-secondary);">请听发音，选择对应的单词</div>`;
      case 'wordForm':
        return `<div>${q.prompt}</div>`; // "happy → ____ (adverb)"
      case 'cloze':
        return `<div style="font-size:var(--font-base);">${q.prompt}</div>`; // sentence with blank
      default:
        return q.prompt;
    }
  }

  _getAnswerAreaHTML(q) {
    switch (q.type) {
      case 'en2cn':
      case 'listen':
        // Multiple choice — 4 options grid
        return `
          <div class="quiz-options">
            ${q.options.map((opt, i) => `
              <button class="quiz-option" data-index="${i}" data-value="${this._escapeAttr(opt)}">${opt}</button>
            `).join('')}
          </div>
        `;

      case 'cn2en':
      case 'wordForm':
        // Text input
        return `
          <div class="quiz-input-area">
            <input type="text" class="input" id="quiz-input"
                   placeholder="${q.type === 'cn2en' ? '输入英文单词...' : '输入正确形式...'}"
                   autocomplete="off" autocapitalize="off" spellcheck="false">
            <button class="btn btn-primary btn-block" id="btn-submit">确认</button>
          </div>
        `;

      case 'cloze':
        // Can be multiple choice or input
        if (q.options) {
          return `
            <div class="quiz-options">
              ${q.options.map((opt, i) => `
                <button class="quiz-option" data-index="${i}" data-value="${this._escapeAttr(opt)}">${opt}</button>
              `).join('')}
            </div>
          `;
        }
        return `
          <div class="quiz-input-area">
            <input type="text" class="input" id="quiz-input"
                   placeholder="输入单词..." autocomplete="off" autocapitalize="off" spellcheck="false">
            <button class="btn btn-primary btn-block" id="btn-submit">确认</button>
          </div>
        `;

      default:
        return '';
    }
  }

  _bindEvents(container, q) {
    // TTS button
    const ttsBtn = container.querySelector('#btn-tts');
    if (ttsBtn) {
      ttsBtn.addEventListener('click', () => {
        ttsBtn.classList.add('playing');
        TTS.speak(q.audioText).then(() => {
          ttsBtn.classList.remove('playing');
        });
      });
    }

    // Multiple choice options
    const optionBtns = container.querySelectorAll('.quiz-option');
    optionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.answered) return;
        const userAnswer = btn.dataset.value;
        this._submitAnswer(container, q, userAnswer, btn);
      });
    });

    // Submit button for input type
    const submitBtn = container.querySelector('#btn-submit');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        if (this.answered) return;
        const input = container.querySelector('#quiz-input');
        if (!input || !input.value.trim()) {
          input?.classList.add('wrong');
          setTimeout(() => input?.classList.remove('wrong'), 500);
          return;
        }
        this._submitAnswer(container, q, input.value.trim());
      });

      // Enter key
      const input = container.querySelector('#quiz-input');
      if (input) {
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') submitBtn.click();
        });
        input.focus();
      }
    }

    // Next button
    const nextBtn = container.querySelector('#btn-next');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.session.nextQuestion();
        this._renderQuestion(container);
      });
    }

    // Back button
    const backBtn = document.getElementById('btn-back');
    if (backBtn) {
      backBtn.onclick = () => {
        TTS.cancel();
        router.navigate('/map');
      };
    }
  }

  _submitAnswer(container, q, userAnswer, clickedBtn) {
    this.answered = true;
    const timeMs = Date.now() - this.startTime;

    // Submit to session
    const result = this.session.submitAnswer(userAnswer, timeMs);

    // Show feedback
    const feedback = container.querySelector('#quiz-feedback');
    if (feedback) {
      feedback.textContent = result.correct ? '✅ 正确！' : `❌ 正确答案：${result.correctAnswer}`;
      feedback.className = `quiz-feedback ${result.correct ? 'correct' : 'wrong'}`;
    }

    // Highlight correct option for multiple choice
    const optionBtns = container.querySelectorAll('.quiz-option');
    optionBtns.forEach(btn => {
      btn.disabled = true;
      const val = btn.dataset.value;
      if (val === result.correctAnswer) {
        btn.classList.add('correct');
      } else if (btn === clickedBtn && !result.correct) {
        btn.classList.add('wrong');
      }
    });

    // Highlight input
    const input = container.querySelector('#quiz-input');
    if (input) {
      input.disabled = true;
      if (result.correct) {
        input.classList.add('correct');
      } else {
        input.classList.add('wrong');
      }
    }

    // Show next button
    const nextBtn = container.querySelector('#btn-next');
    if (nextBtn) {
      nextBtn.classList.remove('hidden');
      nextBtn.focus();
    }

    // Keyboard shortcut for next
    const handleKey = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        document.removeEventListener('keydown', handleKey);
        this.session.nextQuestion();
        this._renderQuestion(container);
      }
    };
    document.addEventListener('keydown', handleKey);
  }

  _finish(container) {
    TTS.cancel();

    // Store results for the results screen
    const results = this.session.getResults();
    sessionStorage.setItem('quizResult', JSON.stringify(results));

    router.navigate('/results');
  }

  _escapeAttr(str) {
    return str.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  destroy() {
    TTS.cancel();
    this.session = null;
  }
}
