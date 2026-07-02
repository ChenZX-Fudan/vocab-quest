import { setTitle, setBackButton } from '../components/navbar.js';
import { confirm, alert } from '../components/modal.js';
import { TTS } from '../components/tts.js';
import * as settings from '../models/settings.js';
import * as db from '../db.js';

export default class SettingsScreen {
  async render(container) {
    setTitle('设置');
    setBackButton(false);

    const all = settings.getAll();
    const voices = TTS.getVoices();

    container.innerHTML = `
      <div class="screen">
        <!-- Question Types -->
        <div class="card">
          <div class="card-title mb-md">📝 题型设置</div>
          <div class="card-subtitle mb-md">勾选你想要练习的题型</div>
          ${[
            { key: 'en2cn', label: '📖 英译中选择题', weight: 'en2cn' },
            { key: 'cn2en', label: '✏️ 中译英拼写题', weight: 'cn2en' },
            { key: 'listen', label: '🎧 听音选词', weight: 'listen' },
            { key: 'wordForm', label: '🔄 词形变化', weight: 'wordForm' },
            { key: 'cloze', label: '📝 完形填空', weight: 'cloze' },
          ].map(t => {
            const enabled = all.questionTypes.includes(t.key);
            const weight = all.typeWeights?.[t.weight] || 20;
            return `
              <div class="flex-between mb-sm" style="padding:8px 0;border-bottom:1px solid var(--border);">
                <div class="flex-1">
                  <label style="cursor:pointer;display:flex;align-items:center;gap:8px;">
                    <input type="checkbox" data-type="${t.key}" ${enabled ? 'checked' : ''}
                           style="width:18px;height:18px;accent-color:var(--primary);">
                    <span>${t.label}</span>
                  </label>
                </div>
                ${enabled ? `
                  <input type="range" min="5" max="50" value="${weight}" data-weight="${t.weight}"
                         style="width:80px;accent-color:var(--primary);" title="权重: ${weight}%">
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>

        <!-- TTS Settings -->
        <div class="card">
          <div class="card-title mb-md">🔊 语音设置</div>
          <div class="mb-md">
            <div class="text-sm text-secondary mb-sm">语速: ${all.ttsRate.toFixed(1)}x</div>
            <input type="range" id="tts-rate" min="0.5" max="1.5" step="0.1" value="${all.ttsRate}"
                   style="width:100%;accent-color:var(--primary);">
          </div>
          ${voices.length > 0 ? `
            <div>
              <div class="text-sm text-secondary mb-sm">语音:</div>
              <select id="tts-voice" style="width:100%;padding:8px;border-radius:var(--radius);border:1px solid var(--border);font-size:var(--font-sm);">
                <option value="">默认</option>
                ${voices.map(v => `
                  <option value="${v.name}" ${all.ttsVoice === v.name ? 'selected' : ''}>${v.name} (${v.lang})</option>
                `).join('')}
              </select>
            </div>
          ` : '<div class="text-sm text-secondary">加载语音列表中...</div>'}
          <button class="btn btn-outline btn-sm mt-md" id="btn-test-tts">🔊 测试发音</button>
        </div>

        <!-- Theme -->
        <div class="card">
          <div class="card-title mb-md">🎨 主题</div>
          <div class="flex gap-sm">
            <button class="btn ${all.theme === 'light' ? 'btn-primary' : 'btn-outline'} btn-sm" data-theme="light">☀️ 浅色</button>
            <button class="btn ${all.theme === 'dark' ? 'btn-primary' : 'btn-outline'} btn-sm" data-theme="dark">🌙 深色</button>
          </div>
        </div>

        <!-- Sound -->
        <div class="card">
          <div class="flex-between">
            <div>
              <div class="font-bold">🔔 音效</div>
              <div class="text-sm text-secondary">答题正确/错误音效</div>
            </div>
            <label style="position:relative;display:inline-block;width:48px;height:28px;">
              <input type="checkbox" id="sound-toggle" ${all.soundEnabled ? 'checked' : ''}
                     style="opacity:0;width:0;height:0;">
              <span style="position:absolute;cursor:pointer;inset:0;background:${all.soundEnabled ? 'var(--primary)' : 'var(--border)'};border-radius:28px;transition:0.3s;">
                <span style="position:absolute;height:22px;width:22px;left:3px;bottom:3px;background:white;border-radius:50%;transition:0.3s;${all.soundEnabled ? 'transform:translateX(20px);' : ''}"></span>
              </span>
            </label>
          </div>
        </div>

        <!-- Danger Zone -->
        <div class="card" style="border:2px solid var(--danger);">
          <div class="card-title mb-md" style="color:var(--danger);">⚠️ 危险操作</div>
          <button class="btn btn-sm" style="background:var(--danger);color:white;width:100%;" id="btn-reset">
            🗑️ 重置所有进度数据
          </button>
          <div class="text-xs text-secondary mt-sm">这将清除所有关卡进度、错题记录和签到数据，此操作不可撤销。</div>
        </div>
      </div>
    `;

    // Bind events
    this._bindEvents(container);
  }

  _bindEvents(container) {
    // Question type checkboxes
    container.querySelectorAll('input[data-type]').forEach(cb => {
      cb.addEventListener('change', async () => {
        const types = [];
        container.querySelectorAll('input[data-type]:checked').forEach(c => {
          types.push(c.dataset.type);
        });
        await settings.set('questionTypes', types);
        // Refresh to show/hide weight sliders
        this.render(container);
      });
    });

    // Weight sliders
    container.querySelectorAll('input[data-weight]').forEach(slider => {
      slider.addEventListener('change', async () => {
        const weights = settings.get('typeWeights') || {};
        weights[slider.dataset.weight] = parseInt(slider.value);
        await settings.set('typeWeights', weights);
      });
    });

    // TTS rate
    const rateSlider = container.querySelector('#tts-rate');
    if (rateSlider) {
      rateSlider.addEventListener('change', async () => {
        const rate = parseFloat(rateSlider.value);
        await settings.set('ttsRate', rate);
        TTS.setRate(rate);
      });
    }

    // TTS voice
    const voiceSelect = container.querySelector('#tts-voice');
    if (voiceSelect) {
      voiceSelect.addEventListener('change', async () => {
        await settings.set('ttsVoice', voiceSelect.value);
        TTS.setVoice(voiceSelect.value);
      });
    }

    // Test TTS
    const testBtn = container.querySelector('#btn-test-tts');
    if (testBtn) {
      testBtn.addEventListener('click', () => {
        TTS.init();
        TTS.speak('Hello, this is a test of the text to speech system.');
      });
    }

    // Theme
    container.querySelectorAll('[data-theme]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const theme = btn.dataset.theme;
        await settings.set('theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
        this.render(container);
      });
    });

    // Sound toggle
    const soundToggle = container.querySelector('#sound-toggle');
    if (soundToggle) {
      soundToggle.addEventListener('change', async () => {
        await settings.set('soundEnabled', soundToggle.checked);
      });
    }

    // Reset data
    const resetBtn = container.querySelector('#btn-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', async () => {
        const ok = await confirm('确认重置', '确定要清除所有学习数据吗？此操作不可撤销！');
        if (ok) {
          await db.clear('progress');
          await db.clear('errors');
          await db.clear('achievements');
          await db.clear('checkin');
          await db.clear('leaderboard');
          alert('数据已清除，页面将刷新。');
          location.reload();
        }
      });
    }
  }

  destroy() {}
}
