import * as db from '../db.js';

// Badge definitions
export const BADGE_DEFINITIONS = [
  {
    id: 'first-level',
    name: '初次闯关',
    description: '完成第一个关卡',
    icon: '🌟',
    evaluate(stats) {
      return {
        earned: stats.levelsCompleted >= 1,
        progress: { current: Math.min(stats.levelsCompleted, 1), target: 1 }
      };
    }
  },
  {
    id: '5-levels',
    name: '小试牛刀',
    description: '完成5个关卡',
    icon: '⚔️',
    evaluate(stats) {
      return {
        earned: stats.levelsCompleted >= 5,
        progress: { current: Math.min(stats.levelsCompleted, 5), target: 5 }
      };
    }
  },
  {
    id: '20-levels',
    name: '闯关达人',
    description: '完成20个关卡',
    icon: '🛡️',
    evaluate(stats) {
      return {
        earned: stats.levelsCompleted >= 20,
        progress: { current: Math.min(stats.levelsCompleted, 20), target: 20 }
      };
    }
  },
  {
    id: '100words-mastered',
    name: '百词斩',
    description: '掌握100个单词',
    icon: '💯',
    evaluate(stats) {
      return {
        earned: stats.masteryCount >= 100,
        progress: { current: Math.min(stats.masteryCount, 100), target: 100 }
      };
    }
  },
  {
    id: '500words-mastered',
    name: '词汇达人',
    description: '掌握500个单词',
    icon: '📚',
    evaluate(stats) {
      return {
        earned: stats.masteryCount >= 500,
        progress: { current: Math.min(stats.masteryCount, 500), target: 500 }
      };
    }
  },
  {
    id: '1000words-mastered',
    name: '词汇大师',
    description: '掌握1000个单词',
    icon: '🎓',
    evaluate(stats) {
      return {
        earned: stats.masteryCount >= 1000,
        progress: { current: Math.min(stats.masteryCount, 1000), target: 1000 }
      };
    }
  },
  {
    id: 'perfect-score',
    name: '满分学霸',
    description: '任意关卡获得100%正确率',
    icon: '🎯',
    evaluate(stats) {
      return {
        earned: stats.hasPerfectLevel,
        progress: { current: stats.hasPerfectLevel ? 1 : 0, target: 1 }
      };
    }
  },
  {
    id: '3-streak',
    name: '连续三天',
    description: '连续打卡3天',
    icon: '🔥',
    evaluate(stats) {
      return {
        earned: stats.longestStreak >= 3,
        progress: { current: Math.min(stats.longestStreak, 3), target: 3 }
      };
    }
  },
  {
    id: '7-streak',
    name: '周冠军',
    description: '连续打卡7天',
    icon: '👑',
    evaluate(stats) {
      return {
        earned: stats.longestStreak >= 7,
        progress: { current: Math.min(stats.longestStreak, 7), target: 7 }
      };
    }
  },
  {
    id: '30-streak',
    name: '月之星',
    description: '连续打卡30天',
    icon: '⭐',
    evaluate(stats) {
      return {
        earned: stats.longestStreak >= 30,
        progress: { current: Math.min(stats.longestStreak, 30), target: 30 }
      };
    }
  },
  {
    id: 'grade6-complete',
    name: '六年级通关',
    description: '完成所有六年级关卡',
    icon: '💜',
    evaluate(stats) {
      const done = stats.gradeCompletions?.[6] || 0;
      const total = stats.gradeLevelsTotal?.[6] || 0;
      return {
        earned: total > 0 && done >= total,
        progress: { current: Math.min(done, total), target: total }
      };
    }
  },
  {
    id: 'grade7-complete',
    name: '七年级通关',
    description: '完成所有七年级关卡',
    icon: '💙',
    evaluate(stats) {
      const done = stats.gradeCompletions?.[7] || 0;
      const total = stats.gradeLevelsTotal?.[7] || 0;
      return {
        earned: total > 0 && done >= total,
        progress: { current: Math.min(done, total), target: total }
      };
    }
  },
  {
    id: 'grade8-complete',
    name: '八年级通关',
    description: '完成所有八年级关卡',
    icon: '💚',
    evaluate(stats) {
      const done = stats.gradeCompletions?.[8] || 0;
      const total = stats.gradeLevelsTotal?.[8] || 0;
      return {
        earned: total > 0 && done >= total,
        progress: { current: Math.min(done, total), target: total }
      };
    }
  },
  {
    id: 'grade9-complete',
    name: '九年级通关',
    description: '完成所有九年级关卡',
    icon: '💛',
    evaluate(stats) {
      const done = stats.gradeCompletions?.[9] || 0;
      const total = stats.gradeLevelsTotal?.[9] || 0;
      return {
        earned: total > 0 && done >= total,
        progress: { current: Math.min(done, total), target: total }
      };
    }
  },
  {
    id: 'all-clear',
    name: '全部通关',
    description: '完成所有关卡',
    icon: '🏆',
    evaluate(stats) {
      const total = Object.values(stats.gradeLevelsTotal || {}).reduce((a, b) => a + b, 0);
      const done = Object.values(stats.gradeCompletions || {}).reduce((a, b) => a + b, 0);
      return {
        earned: total > 0 && done >= total,
        progress: { current: Math.min(done, total), target: total }
      };
    }
  }
];

let achievementCache = {};

/**
 * Initialize achievements from DB.
 */
export async function init() {
  const all = await db.getAll('achievements');
  achievementCache = {};
  for (const a of all) {
    achievementCache[a.badgeId] = a;
  }
}

/**
 * Check and award any newly-earned badges.
 * Returns badges that were just earned (for notification).
 */
export async function checkAndAward(stats) {
  const newlyEarned = [];

  for (const def of BADGE_DEFINITIONS) {
    const existing = achievementCache[def.id];
    if (existing?.earned) continue; // already earned

    const result = def.evaluate(stats);
    if (result.earned) {
      const entry = {
        badgeId: def.id,
        earned: true,
        earnedAt: Date.now(),
        progress: result.progress
      };
      achievementCache[def.id] = entry;
      await db.put('achievements', entry);
      newlyEarned.push(def);
    } else if (!existing || existing.progress?.current !== result.progress.current) {
      // Update progress
      const entry = {
        badgeId: def.id,
        earned: false,
        earnedAt: 0,
        progress: result.progress
      };
      achievementCache[def.id] = entry;
      await db.put('achievements', entry);
    }
  }

  return newlyEarned;
}

/**
 * Get all badges with their current status.
 */
export function getAllBadges() {
  return BADGE_DEFINITIONS.map(def => ({
    ...def,
    earned: achievementCache[def.id]?.earned || false,
    earnedAt: achievementCache[def.id]?.earnedAt || 0,
    progress: achievementCache[def.id]?.progress || { current: 0, target: 1 }
  }));
}

/**
 * Get count of earned badges.
 */
export function getEarnedCount() {
  return Object.values(achievementCache).filter(a => a.earned).length;
}
