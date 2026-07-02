/**
 * Render the streak badge in the header.
 * @param {number} streak - current streak days
 * @returns {string} HTML
 */
export function renderHeader(streak = 0) {
  if (streak <= 0) return '';
  const flame = streak >= 30 ? '🔥' : streak >= 7 ? '🔥' : '🔥';
  return `
    <span class="streak-flame" title="连续打卡 ${streak} 天">
      ${flame} ${streak}天
    </span>
  `;
}

/**
 * Render the check-in card for home screen.
 * @param {number} streak - current streak
 * @param {boolean} checkedIn - already checked in today?
 * @returns {string} HTML
 */
export function renderCheckInCard(streak, checkedIn) {
  return `
    <div class="card text-center" style="background: linear-gradient(135deg, #FEF3C7, #FDE68A);">
      <div style="font-size:3rem;margin-bottom:8px;">${checkedIn ? '✅' : '📅'}</div>
      <div style="font-size:var(--font-2xl);font-weight:800;color:#92400E;">
        ${checkedIn ? '今日已打卡' : '今日打卡'}
      </div>
      <div style="font-size:var(--font-lg);font-weight:700;color:#B45309;margin-top:4px;">
        连续 <span style="font-size:var(--font-2xl);">${streak}</span> 天
      </div>
      ${!checkedIn ? `
        <button class="btn btn-warning btn-lg btn-block mt-md" id="btn-checkin">
          🔥 打卡签到
        </button>
      ` : `
        <div style="margin-top:12px;font-size:var(--font-sm);color:#92400E;">
          明天继续保持！
        </div>
      `}
    </div>
  `;
}
