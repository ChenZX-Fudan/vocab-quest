import { router } from '../router.js';
import { setTitle, setBackButton } from '../components/navbar.js';
import { render as renderStars } from '../components/starRating.js';
import { confirm } from '../components/modal.js';
import * as vocab from '../models/vocab.js';

export default class ResultsScreen {
  async render(container) {
    setTitle('关卡结算');
    setBackButton(false);

    // Read results from sessionStorage
    const json = sessionStorage.getItem('quizResult');
    if (!json) {
      router.navigate('/map');
      return;
    }

    const results = JSON.parse(json);
    const { totalQuestions, correctCount, accuracy, totalXP, baseXP, streakBonus, speedBonus, stars, answers, levelKey } = results;

    // Level info
    let levelLabel = '错题复习';
    if (levelKey && levelKey !== 'review') {
      levelLabel = vocab.getLevelLabel(levelKey);
    }

    container.innerHTML = `
      <div class="screen results-container">
        <!-- Stars -->
        <div class="results-header">
          <div class="results-stars">
            ${renderStars(stars)}
          </div>
          <div class="results-accuracy">${accuracy}%</div>
          <div class="results-label">${this._getResultMessage(accuracy)}</div>
        </div>

        <!-- XP Breakdown -->
        <div class="card">
          <div class="results-xp">
            <div class="results-xp-item">
              <div class="results-xp-value">+${baseXP}</div>
              <div class="results-xp-label">基础分</div>
            </div>
            <div class="results-xp-item">
              <div class="results-xp-value">+${streakBonus}</div>
              <div class="results-xp-label">连击加分</div>
            </div>
            <div class="results-xp-item">
              <div class="results-xp-value">+${speedBonus}</div>
              <div class="results-xp-label">速度加分</div>
            </div>
          </div>
          <div class="text-center mt-md">
            <span style="font-size:var(--font-2xl);font-weight:800;color:var(--primary);">+${totalXP} XP</span>
          </div>
        </div>

        <!-- Accuracy -->
        <div class="card">
          <div class="flex-between mb-sm">
            <span>正确率</span>
            <span class="font-bold">${correctCount}/${totalQuestions}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-bar-fill ${accuracy >= 70 ? 'success' : accuracy >= 50 ? 'warning' : 'danger'}"
                 style="width:${accuracy}%"></div>
          </div>
        </div>

        <!-- Word-by-word review -->
        <div class="card">
          <div class="card-title mb-md">📋 答题详情</div>
          <div class="results-words">
            ${answers.map((a, i) => {
              const word = vocab.getWordById(a.wordId);
              return `
                <div class="results-word-item ${a.correct ? 'correct' : 'wrong'}">
                  <span class="results-word-icon">${a.correct ? '✅' : '❌'}</span>
                  <div>
                    <div class="results-word-en">${word?.en || a.wordId}</div>
                    <div class="results-word-cn">${word?.cn || ''} ${!a.correct ? `→ 你的答案: ${a.userAnswer}` : ''}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Actions -->
        <div class="results-actions">
          ${levelKey !== 'review' ? `
            <button class="btn btn-outline" id="btn-retry">🔄 再试一次</button>
          ` : ''}
          <button class="btn btn-primary" id="btn-next-level">
            ${levelKey !== 'review' ? '▶️ 下一关' : '📝 返回错题本'}
          </button>
        </div>
        <button class="btn btn-ghost btn-block mt-sm" id="btn-home">🏠 返回地图</button>
      </div>
    `;

    // Bind events
    const btnRetry = container.querySelector('#btn-retry');
    if (btnRetry) {
      btnRetry.addEventListener('click', () => {
        if (levelKey) router.navigate(`/quiz/${levelKey}`);
      });
    }

    const btnNext = container.querySelector('#btn-next-level');
    if (btnNext) {
      btnNext.addEventListener('click', () => {
        if (levelKey !== 'review') {
          const nextKey = vocab.getNextLevel(levelKey);
          if (nextKey) {
            router.navigate(`/quiz/${nextKey}`);
          } else {
            router.navigate('/map');
          }
        } else {
          router.navigate('/errors');
        }
      });
    }

    const btnHome = container.querySelector('#btn-home');
    if (btnHome) {
      btnHome.addEventListener('click', () => router.navigate('/map'));
    }

    // Back button → map
    const backBtn = document.getElementById('btn-back');
    if (backBtn) {
      backBtn.classList.remove('hidden');
      backBtn.onclick = () => router.navigate('/map');
    }
  }

  _getResultMessage(accuracy) {
    if (accuracy === 100) return '🎉 满分！太厉害了！';
    if (accuracy >= 90) return '👏 非常棒！接近完美！';
    if (accuracy >= 70) return '💪 不错！继续加油！';
    if (accuracy >= 50) return '📖 还需要多练习哦~';
    return '🌱 别灰心，每次尝试都在进步！';
  }

  destroy() {
    sessionStorage.removeItem('quizResult');
  }
}
