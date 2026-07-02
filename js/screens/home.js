import { router } from '../router.js';
import { setTitle, setBackButton } from '../components/navbar.js';
import { renderCheckInCard } from '../components/streakBadge.js';
import { render as renderStars } from '../components/starRating.js';
import * as progress from '../models/progress.js';
import * as checkin from '../models/checkin.js';
import * as errors from '../models/errors.js';
import * as achievements from '../models/achievements.js';
import { getLevelKeys, getGradeName, getTotalWordCount, getLevelCountByGrade } from '../models/vocab.js';

export default class HomeScreen {
  async render(container) {
    setTitle('单词闯关');
    setBackButton(false);

    // Stats
    const stats = progress.getStats();
    const streak = checkin.getCurrentStreak();
    const isCheckedIn = checkin.isTodayCheckedIn();
    const totalWords = getTotalWordCount();
    const levelCounts = getLevelCountByGrade();
    const totalLevels = getLevelKeys().length;
    const earnedBadges = achievements.getEarnedCount();

    // Update stats with streak
    stats.longestStreak = checkin.getLongestStreak();
    stats.gradeLevelsTotal = levelCounts;

    container.innerHTML = `
      <div class="screen">
        <!-- Check-in Card -->
        ${renderCheckInCard(streak, isCheckedIn)}

        <!-- Quick Stats -->
        <div class="map-progress-summary">
          <div class="map-stat">
            <div class="map-stat-value">${stats.levelsCompleted}</div>
            <div class="map-stat-label">已通关/${totalLevels}</div>
          </div>
          <div class="map-stat">
            <div class="map-stat-value">${stats.masteryCount}</div>
            <div class="map-stat-label">掌握词汇/${totalWords}</div>
          </div>
          <div class="map-stat">
            <div class="map-stat-value">🔥 ${streak}</div>
            <div class="map-stat-label">连续打卡</div>
          </div>
          <div class="map-stat">
            <div class="map-stat-value">${earnedBadges}</div>
            <div class="map-stat-label">徽章</div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="grid-2 mb-md">
          <button class="btn btn-primary btn-lg" id="btn-continue">
            🎮 继续闯关
          </button>
          <button class="btn btn-outline btn-lg" id="btn-review">
            📝 复习错题
          </button>
        </div>

        <!-- Grade Progress -->
        <div class="card">
          <div class="card-title mb-md">📊 各年级进度</div>
          ${[6, 7, 8, 9].map(g => {
            const done = stats.gradeCompletions?.[g] || 0;
            const total = levelCounts[g] || 0;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            return `
              <div class="mb-sm" style="display:flex;align-items:center;gap:12px;">
                <span class="grade-badge grade${g}" style="min-width:60px;text-align:center;">${getGradeName(g)}</span>
                <div class="progress-bar" style="flex:1;">
                  <div class="progress-bar-fill ${pct >= 100 ? 'success' : ''}" style="width:${pct}%"></div>
                </div>
                <span style="font-size:var(--font-xs);color:var(--text-secondary);min-width:40px;">${done}/${total}</span>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Recent Achievement -->
        <div class="card">
          <div class="card-title mb-md">🏆 最近成就</div>
          <div id="recent-badges" class="grid-3">
            ${achievements.getAllBadges()
              .filter(b => b.earned)
              .slice(-3)
              .map(b => `
                <div class="achievement-card">
                  <div class="achievement-icon">${b.icon}</div>
                  <div class="achievement-name">${b.name}</div>
                </div>
              `).join('') || '<div class="empty-state"><div class="empty-state-text">开始闯关获取成就吧！</div></div>'}
          </div>
        </div>
      </div>
    `;

    // Event: Check-in button
    const checkinBtn = container.querySelector('#btn-checkin');
    if (checkinBtn) {
      checkinBtn.addEventListener('click', async () => {
        checkinBtn.disabled = true;
        const result = await checkin.checkInToday();
        if (!result.alreadyCheckedIn) {
          // Re-render
          this.render(container);
        }
      });
    }

    // Event: Continue learning
    const continueBtn = container.querySelector('#btn-continue');
    if (continueBtn) {
      continueBtn.addEventListener('click', () => {
        router.navigate('/map');
      });
    }

    // Event: Review errors
    const reviewBtn = container.querySelector('#btn-review');
    if (reviewBtn) {
      reviewBtn.addEventListener('click', () => {
        router.navigate('/errors');
      });
    }
  }

  destroy() {}
}
