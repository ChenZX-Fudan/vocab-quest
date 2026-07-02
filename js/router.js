/**
 * Hash-based SPA Router.
 * Routes are registered with pattern strings and handler classes.
 */
class Router {
  constructor() {
    this.routes = [];
    this.currentScreen = null;
    this.currentPath = null;
    this._onHashChange = this._onHashChange.bind(this);
  }

  /**
   * Register a route pattern and its screen handler.
   * Patterns like '/quiz/:levelKey' extract named params.
   */
  on(pattern, ScreenClass) {
    const paramNames = [];
    const regexStr = pattern.replace(/:([a-zA-Z_]+)/g, (_, name) => {
      paramNames.push(name);
      return '([^/]+)';
    });
    this.routes.push({
      pattern,
      regex: new RegExp(`^${regexStr}$`),
      paramNames,
      ScreenClass
    });
  }

  /**
   * Start listening for hash changes.
   */
  start() {
    window.addEventListener('hashchange', this._onHashChange);
    // Trigger initial route
    this._onHashChange();
  }

  /**
   * Programmatic navigation.
   */
  navigate(path) {
    if (!path.startsWith('#')) path = '#' + path;
    window.location.hash = path;
  }

  /**
   * Get current path without hash.
   */
  getPath() {
    const hash = window.location.hash.slice(1) || '/';
    return hash;
  }

  _onHashChange() {
    const path = this.getPath();

    // Find matching route
    for (const route of this.routes) {
      const match = path.match(route.regex);
      if (match) {
        // Build params object
        const params = {};
        route.paramNames.forEach((name, i) => {
          params[name] = decodeURIComponent(match[i + 1]);
        });

        // Destroy previous screen
        if (this.currentScreen && this.currentScreen.destroy) {
          this.currentScreen.destroy();
        }

        // Render new screen
        const container = document.getElementById('app-content');
        if (container) {
          container.innerHTML = '';
          const screen = new route.ScreenClass();
          this.currentScreen = screen;
          this.currentPath = path;
          screen.render(container, params);
        }

        // Update nav active state
        this._updateNav(path);
        return;
      }
    }

    // No match — redirect to home
    console.warn('No route matched:', path);
    window.location.hash = '#/';
  }

  _updateNav(path) {
    // Remove all active states
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });

    // Determine which nav item to highlight
    // Direct routes
    const navMap = {
      '/': '/',
      '/map': '/map',
      '/errors': '/errors',
      '/achievements': '/achievements',
      '/settings': '/settings',
    };

    let activeRoute = null;

    // Check direct match
    if (navMap[path]) {
      activeRoute = navMap[path];
    } else {
      // Check prefix matches (e.g., /quiz/* maps to nothing or /map)
      if (path.startsWith('/quiz') || path.startsWith('/results')) {
        // During quiz/results, highlight Map tab
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
}

// Singleton instance
export const router = new Router();
