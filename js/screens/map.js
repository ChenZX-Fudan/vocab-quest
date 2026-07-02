import { router } from '../router.js';
import { setTitle, setBackButton } from '../components/navbar.js';
import { render as renderStars } from '../components/starRating.js';
import { render as renderProgress } from '../components/progressBar.js';
import * as progress from '../models/progress.js';
import * as vocab from '../models/vocab.js';

export default class MapScreen {
  async render(container, params) {
    setTitle('闯关地图');
    setBackButton(false);

    const stats = progress.getStats();
    const levelCounts = vocab.getLevelCountByGrade();
    const totalLevels = vocab.getLevelKeys().length;
    const grades = vocab.getAvailableGrades();

    container.innerHTML = `
      <div class="screen">
        <!-- Summary -->
        <div class="map-progress-summary">
          <div class="map-stat">
            <div class="map-stat-value">${stats.levelsCompleted}/${totalLevels}</div>
            <div class="map-stat-label">关卡进度</div>
          </div>
          <div class="map-stat">
            <div class="map-stat-value">${stats.totalStars}</div>
            <div class="map-stat-label">总星星</div>
          </div>
          <div class="map-stat">
            <div class="map-stat-value">${stats.masteryCount}</div>
            <div class="map-stat-label">已掌握</div>
          </div>
        </div>

        <!-- Grade Sections -->
        <div class="map-container" id="map-container">
          ${grades.map(grade => {
            const keys = vocab.getLevelKeysByGrade(grade);
            const done = stats.gradeCompletions?.[grade] || 0;
            const total = levelCounts[grade] || 0;

            return `
              <div class="map-grade-section">
                <div class="map-grade-heading">
                  <span class="grade-dot grade${grade}"></span>
                  <span>${vocab.getGradeName(grade)}</span>
                  <span style="font-size:var(--font-sm);color:var(--text-secondary);margin-left:auto;">
                    ${done}/${total} 关
                  </span>
                </div>
                ${this._renderNodes(keys)}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    // Click handlers on nodes
    container.querySelectorAll('.map-node.unlocked, .map-node.current, .map-node.completed').forEach(node => {
      node.addEventListener('click', () => {
        const levelKey = node.dataset.level;
        if (levelKey) router.navigate(`/quiz/${levelKey}`);
      });
    });
  }

  _renderNodes(keys) {
    // Group keys by unit
    const byUnit = {};
    for (const k of keys) {
      const [, unit] = vocab.parseLevelKey(k);
      if (!byUnit[unit]) byUnit[unit] = [];
      byUnit[unit].push(k);
    }

    return Object.entries(byUnit).map(([unit, levelKeys]) => {
      const nodes = levelKeys.map(k => {
        const p = progress.get(k);
        const isUnlocked = progress.isUnlocked(k);
        const stars = p?.stars || 0;
        const completed = p?.completed;
        const wordCount = vocab.getWordsByLevel(k).length;

        // Determine node state class
        let stateClass = 'locked';
        if (completed) {
          stateClass = 'completed';
        } else if (isUnlocked) {
          // Check if this is the "next" level to play
          const prevKey = vocab.getPreviousLevel(k);
          const prevDone = prevKey ? (progress.get(prevKey)?.stars >= 1) : true;
          const thisIncomplete = !p || p.stars < 3;
          stateClass = (prevDone && thisIncomplete) ? 'current' : 'unlocked';
        }

        const gradeMatch = k.match(/^g(\d+)/);
        const gradeNum = gradeMatch ? parseInt(gradeMatch[1]) : 6;

        return `
          <div class="map-node ${stateClass} grade${gradeNum}" data-level="${k}">
            <span class="map-node-label">U${unit}-${k.endsWith('g1') ? 'A' : 'B'}</span>
            <span class="map-node-wordcount">${wordCount}词</span>
            <div class="map-node-stars">${renderStars(stars)}</div>
          </div>
        `;
      }).join('');

      return `
        <div class="map-unit-row">
          <div class="map-unit-label">U${unit}</div>
          <div class="map-nodes">${nodes}</div>
        </div>
      `;
    }).join('');
  }

  destroy() {}
}
