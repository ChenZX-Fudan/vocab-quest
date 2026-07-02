import { router } from '../router.js';
import { setTitle, setBackButton } from '../components/navbar.js';
import * as errors from '../models/errors.js';

export default class ErrorsScreen {
  constructor() {
    this.sortBy = 'recent';
  }

  async render(container) {
    setTitle('错题本');
    setBackButton(false);

    const allErrors = await errors.getAllErrors(this.sortBy);
    const dueCount = await errors.getDueCount();
    const masteredCount = await errors.getMasteredCount();

    container.innerHTML = `
      <div class="screen">
        <!-- Stats bar -->
        <div class="map-progress-summary">
          <div class="map-stat">
            <div class="map-stat-value">${allErrors.length}</div>
            <div class="map-stat-label">总错题</div>
          </div>
          <div class="map-stat">
            <div class="map-stat-value" style="color:var(--danger);">${dueCount}</div>
            <div class="map-stat-label">待复习</div>
          </div>
          <div class="map-stat">
            <div class="map-stat-value" style="color:var(--success);">${masteredCount}</div>
            <div class="map-stat-label">已掌握</div>
          </div>
        </div>

        ${dueCount > 0 ? `
          <button class="btn btn-warning btn-lg btn-block mb-md" id="btn-review-due">
            🔄 复习待巩固单词 (${dueCount})
          </button>
        ` : ''}

        <!-- Sort tabs -->
        <div class="flex gap-sm mb-md" style="overflow-x:auto;">
          <button class="btn btn-sm ${this.sortBy === 'recent' ? 'btn-primary' : 'btn-ghost'}" data-sort="recent">最近</button>
          <button class="btn btn-sm ${this.sortBy === 'due' ? 'btn-primary' : 'btn-ghost'}" data-sort="due">待复习</button>
          <button class="btn btn-sm ${this.sortBy === 'count' ? 'btn-primary' : 'btn-ghost'}" data-sort="count">最多错</button>
        </div>

        <!-- Error list -->
        ${allErrors.length === 0 ? `
          <div class="empty-state">
            <div class="empty-state-icon">🎉</div>
            <div class="empty-state-text">没有错题，太棒了！</div>
          </div>
        ` : `
          <div id="error-list">
            ${allErrors.map(e => {
              const word = e.word;
              const lastError = e.errorHistory[0];
              const dueDate = e.nextReviewAt ? new Date(e.nextReviewAt).toLocaleDateString('zh-CN') : '';
              const isDue = !e.mastered && e.nextReviewAt <= Date.now();

              return `
                <div class="card mb-sm" style="border-left: 3px solid ${e.mastered ? 'var(--success)' : isDue ? 'var(--danger)' : 'var(--warning)'};">
                  <div class="flex-between">
                    <div>
                      <div style="font-size:var(--font-lg);font-weight:700;color:var(--primary);">${word.en}</div>
                      <div style="font-size:var(--font-sm);color:var(--text-secondary);">${word.cn}</div>
                    </div>
                    <div style="text-align:right;">
                      <span class="badge ${e.mastered ? 'badge-success' : isDue ? 'badge-danger' : 'badge-warning'}">
                        ${e.mastered ? '✅ 已掌握' : isDue ? '⏰ 待复习' : `📅 ${dueDate}`}
                      </span>
                      <div style="font-size:var(--font-xs);color:var(--text-tertiary);margin-top:4px;">
                        错误${e.errorHistory.length}次
                      </div>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;

    // Sort tab clicks
    container.querySelectorAll('[data-sort]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        this.sortBy = e.target.dataset.sort;
        await this.render(container);
      });
    });

    // Review due button
    const reviewBtn = container.querySelector('#btn-review-due');
    if (reviewBtn) {
      reviewBtn.addEventListener('click', () => {
        router.navigate('/quiz/review');
      });
    }
  }

  destroy() {}
}
