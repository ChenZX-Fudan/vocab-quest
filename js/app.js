import { open as openDB } from './db.js';
import { init as initVocab } from './models/vocab.js';
import { init as initProgress } from './models/progress.js';
import { init as initErrors } from './models/errors.js';
import { init as initAchievements } from './models/achievements.js';
import { init as initSettings } from './models/settings.js';
import { init as initCheckin, checkInToday } from './models/checkin.js';
import { router } from './router.js';
import { TTS } from './components/tts.js';
import { renderHeader as renderStreak } from './components/streakBadge.js';
import * as checkinModel from './models/checkin.js';

// Screen imports (needed for router registration)
import HomeScreen from './screens/home.js';
import MapScreen from './screens/map.js';
import QuizScreen from './screens/quiz.js';
import ResultsScreen from './screens/results.js';
import ErrorsScreen from './screens/errors.js';
import LeaderboardScreen from './screens/leaderboard.js';
import AchievementsScreen from './screens/achievements.js';
import SettingsScreen from './screens/settings.js';

async function bootstrap() {
  try {
    // 1. Open IndexedDB (creates stores on first run)
    await openDB();

    // 2. Initialize settings (needed early for theme)
    await initSettings();
    const { get: getSetting } = await import('./models/settings.js');
    const theme = getSetting('theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);

    // 3. Load vocabulary data into memory
    initVocab();

    // 4. Load progress cache
    await initProgress();

    // 5. Load error notebook
    await initErrors();

    // 6. Load achievements
    await initAchievements();

    // 7. Load check-in state
    await initCheckin();

    // 8. Initialize TTS (warm up on first user gesture)
    // Defer TTS init to first user interaction
    document.addEventListener('click', () => {
      TTS.init();
      TTS.loadVoice();
    }, { once: true });

    // 9. Register Service Worker
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content available — show update toast
                const toast = document.getElementById('update-toast');
                if (toast) {
                  toast.classList.remove('hidden');
                  const updateBtn = document.getElementById('btn-update');
                  if (updateBtn) {
                    updateBtn.addEventListener('click', () => {
                      newWorker.postMessage({ action: 'skipWaiting' });
                      window.location.reload();
                    });
                  }
                }
              }
            });
          }
        });

        // Handle SW controller change
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload();
        });
      } catch (err) {
        console.warn('Service Worker registration failed:', err);
      }
    }

    // 10. Register routes
    router.on('/', HomeScreen);
    router.on('/map', MapScreen);
    router.on('/quiz/:levelKey', QuizScreen);
    router.on('/results', ResultsScreen);
    router.on('/errors', ErrorsScreen);
    router.on('/leaderboard', LeaderboardScreen);
    router.on('/achievements', AchievementsScreen);
    router.on('/settings', SettingsScreen);

    // 11. Silent check-in on startup
    try {
      await checkInToday();
    } catch (e) {
      // Non-critical
    }

    // 12. Update header streak display
    updateHeaderStreak();

    // 13. Start the router
    router.start();

    console.log('✅ 单词闯关 PWA 启动成功！');
    console.log(`   词汇总量: ${import('./models/vocab.js').then(m => m.getTotalWordCount())} 词`);

  } catch (err) {
    console.error('App initialization failed:', err);
    document.body.innerHTML = `
      <div class="error-screen" style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100dvh;padding:24px;text-align:center;">
        <div style="font-size:3rem;margin-bottom:16px;">😵</div>
        <h1 style="margin-bottom:8px;">应用启动失败</h1>
        <p style="color:var(--text-secondary);margin-bottom:16px;">${err.message}</p>
        <button class="btn btn-primary" onclick="location.reload()">🔄 重试</button>
      </div>
    `;
  }
}

/**
 * Update the header streak display.
 */
function updateHeaderStreak() {
  const streak = checkinModel.getCurrentStreak();
  const el = document.getElementById('header-streak');
  if (el && streak > 0) {
    el.innerHTML = renderStreak(streak);
  }
}

// Generate simple placeholder icons if needed (for PWA)
function generatePlaceholderIcons() {
  // These would be real PNG files in production.
  // For development, this is just a note that icons should exist.
  console.log('PWA icons: ensure assets/icons/icon-192.png and icon-512.png exist.');
}

// Boot
bootstrap();
