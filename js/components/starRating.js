/**
 * Render star rating HTML.
 * @param {number} stars - 0 to 3
 * @param {number} max - total stars (default 3)
 * @returns {string} HTML
 */
export function render(stars = 0, max = 3) {
  let html = '<span class="star-rating">';
  for (let i = 1; i <= max; i++) {
    const filled = i <= stars;
    html += `<span class="star ${filled ? 'filled' : 'empty'}">${filled ? '⭐' : '☆'}</span>`;
  }
  html += '</span>';
  return html;
}
