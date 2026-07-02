/**
 * Render a badge/achievement icon card.
 * @param {object} badge - { id, name, description, icon, earned, progress }
 * @returns {string} HTML
 */
export function render(badge) {
  const { name, description, icon, earned, progress } = badge;
  const pct = progress && progress.target > 0
    ? Math.round((progress.current / progress.target) * 100)
    : 0;

  return `
    <div class="achievement-card ${earned ? '' : 'locked'}">
      <div class="achievement-icon">${earned ? icon : '🔒'}</div>
      <div class="achievement-name">${name}</div>
      <div class="achievement-desc">${description}</div>
      ${!earned && progress ? `
        <div style="width:100%;margin-top:8px;">
          <div class="progress-bar">
            <div class="progress-bar-fill warning" style="width:${pct}%"></div>
          </div>
          <div style="font-size:0.65rem;color:var(--text-tertiary);margin-top:2px;">${progress.current}/${progress.target}</div>
        </div>
      ` : ''}
    </div>
  `;
}
