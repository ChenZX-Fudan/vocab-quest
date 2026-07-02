import { setTitle, setBackButton } from '../components/navbar.js';
import { render as renderBadge } from '../components/badgeIcon.js';
import { getAllBadges, getEarnedCount, BADGE_DEFINITIONS } from '../models/achievements.js';

export default class AchievementsScreen {
  async render(container) {
    setTitle('成就徽章');
    setBackButton(false);

    const badges = getAllBadges();
    const earned = getEarnedCount();
    const total = BADGE_DEFINITIONS.length;

    container.innerHTML = `
      <div class="screen">
        <!-- Summary -->
        <div class="map-progress-summary">
          <div class="map-stat">
            <div class="map-stat-value">${earned}/${total}</div>
            <div class="map-stat-label">已获得徽章</div>
          </div>
          <div class="map-stat">
            <div class="map-stat-value">${Math.round((earned / total) * 100)}%</div>
            <div class="map-stat-label">完成度</div>
          </div>
        </div>

        <!-- Badge Grid -->
        <div class="grid-3" id="badge-grid">
          ${badges.map(b => renderBadge(b)).join('')}
        </div>
      </div>
    `;
  }

  destroy() {}
}
