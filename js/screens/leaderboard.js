import { setTitle, setBackButton } from '../components/navbar.js';
import * as checkin from '../models/checkin.js';
import * as progress from '../models/progress.js';
import * as achievements from '../models/achievements.js';

export default class LeaderboardScreen {
  async render(container) {
    setTitle('排行榜');
    setBackButton(false);

    const stats = progress.getStats();
    const streak = checkin.getCurrentStreak();
    const longestStreak = checkin.getLongestStreak();
    const earnedBadges = achievements.getEarnedCount();
    const totalBadges = achievements.BADGE_DEFINITIONS.length;

    container.innerHTML = `
      <div class="screen">
        <!-- Personal Stats Card -->
        <div class="card text-center" style="background: linear-gradient(135deg, #DBEAFE, #C7D2FE);">
          <div style="font-size:3rem;margin-bottom:8px;">🏅</div>
          <div style="font-size:var(--font-2xl);font-weight:800;color:var(--primary-dark);">我的战绩</div>
        </div>

        <div class="grid-2">
          <div class="card text-center">
            <div style="font-size:2rem;">⭐</div>
            <div style="font-size:var(--font-2xl);font-weight:800;">${stats.totalXP}</div>
            <div style="font-size:var(--font-sm);color:var(--text-secondary);">总经验值</div>
          </div>
          <div class="card text-center">
            <div style="font-size:2rem;">📚</div>
            <div style="font-size:var(--font-2xl);font-weight:800;">${stats.masteryCount}</div>
            <div style="font-size:var(--font-sm);color:var(--text-secondary);">掌握词汇</div>
          </div>
          <div class="card text-center">
            <div style="font-size:2rem;">🔥</div>
            <div style="font-size:var(--font-2xl);font-weight:800;">${longestStreak}</div>
            <div style="font-size:var(--font-sm);color:var(--text-secondary);">最长连续打卡</div>
          </div>
          <div class="card text-center">
            <div style="font-size:2rem;">🏆</div>
            <div style="font-size:var(--font-2xl);font-weight:800;">${earnedBadges}/${totalBadges}</div>
            <div style="font-size:var(--font-sm);color:var(--text-secondary);">成就徽章</div>
          </div>
        </div>

        <!-- Progress milestones -->
        <div class="card mt-md">
          <div class="card-title mb-md">🎯 学习里程碑</div>
          <div class="flex-between mb-sm">
            <span>通关关卡</span>
            <span class="font-bold">${stats.levelsCompleted} 关</span>
          </div>
          <div class="progress-bar mb-md">
            <div class="progress-bar-fill" style="width:${Math.min(100, (stats.levelsCompleted / 60) * 100)}%"></div>
          </div>

          <div class="flex-between mb-sm">
            <span>掌握词汇</span>
            <span class="font-bold">${stats.masteryCount} 词</span>
          </div>
          <div class="progress-bar mb-md">
            <div class="progress-bar-fill success" style="width:${Math.min(100, (stats.masteryCount / 3500) * 100)}%"></div>
          </div>

          <div class="flex-between mb-sm">
            <span>当前连续打卡</span>
            <span class="font-bold">${streak} 天</span>
          </div>
          <div class="progress-bar">
            <div class="progress-bar-fill warning" style="width:${Math.min(100, (streak / 30) * 100)}%"></div>
          </div>
        </div>
      </div>
    `;
  }

  destroy() {}
}
