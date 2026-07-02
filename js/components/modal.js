/**
 * Show a modal dialog.
 * @param {string} title
 * @param {string} body - HTML content
 * @param {Array<{text:string, class:string, value:any}>} actions - buttons
 * @returns {Promise<any>} resolves to the value of the clicked action
 */
export function show(title, body, actions = [{ text: '确定', class: 'btn-primary', value: 'ok' }]) {
  return new Promise((resolve) => {
    // Remove any existing modal
    const existing = document.querySelector('.modal-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const actionButtons = actions.map(a => {
      const cls = a.class || 'btn-ghost';
      return `<button class="btn btn-sm ${cls}" data-value="${a.value}">${a.text}</button>`;
    }).join('');

    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-title">${title}</div>
        <div class="modal-body">${body}</div>
        <div class="modal-actions">${actionButtons}</div>
      </div>
    `;

    // Click outside to dismiss? No — explicit button only.
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        // Don't close on overlay click for modals with important actions
      }
    });

    // Button click handlers
    overlay.querySelectorAll('.modal-actions .btn').forEach(btn => {
      btn.addEventListener('click', () => {
        overlay.remove();
        resolve(btn.dataset.value);
      });
    });

    document.body.appendChild(overlay);
  });
}

/**
 * Show a simple alert (single OK button).
 */
export function alert(title, body) {
  return show(title, body, [{ text: '确定', class: 'btn-primary', value: 'ok' }]);
}

/**
 * Show a confirm dialog (OK + Cancel).
 */
export function confirm(title, body) {
  return show(title, body, [
    { text: '取消', class: 'btn-ghost', value: false },
    { text: '确定', class: 'btn-primary', value: true }
  ]);
}

/**
 * Show a toast message.
 */
export function toast(message, duration = 2500) {
  const existing = document.getElementById('update-toast');
  if (existing) {
    existing.innerHTML = `<span>${message}</span>`;
    existing.classList.remove('hidden');
    setTimeout(() => existing.classList.add('hidden'), duration);
  }
}
