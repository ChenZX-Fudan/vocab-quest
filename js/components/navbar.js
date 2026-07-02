/**
 * Update the bottom nav bar — highlight active tab.
 * Called by router after navigation.
 */
export function updateNav(path) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });

  const navMap = {
    '/': '/',
    '/map': '/map',
    '/errors': '/errors',
    '/achievements': '/achievements',
    '/settings': '/settings',
  };

  let activeRoute = navMap[path];

  if (!activeRoute) {
    if (path.startsWith('/quiz') || path.startsWith('/results')) {
      activeRoute = '/map';
    } else if (path.startsWith('/leaderboard')) {
      activeRoute = '/achievements';
    }
  }

  if (activeRoute) {
    const navItem = document.querySelector(`.nav-item[data-route="${activeRoute}"]`);
    if (navItem) navItem.classList.add('active');
  }
}

/**
 * Show/hide the back button in the header.
 */
export function setBackButton(visible) {
  const btn = document.getElementById('btn-back');
  if (btn) {
    btn.classList.toggle('hidden', !visible);
  }
}

/**
 * Set header title.
 */
export function setTitle(title) {
  const el = document.getElementById('header-title');
  if (el) el.textContent = title;
}
