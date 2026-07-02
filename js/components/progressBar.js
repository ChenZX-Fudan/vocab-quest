/**
 * Render a progress bar.
 * @param {number} current
 * @param {number} total
 * @param {string} colorClass - 'success' | 'warning' | 'danger' | '' (default primary)
 * @returns {string} HTML
 */
export function render(current, total, colorClass = '') {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return `
    <div class="progress-bar">
      <div class="progress-bar-fill ${colorClass}" style="width: ${pct}%"></div>
    </div>
  `;
}
