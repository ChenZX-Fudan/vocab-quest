import * as db from '../db.js';
import { formatDate } from '../utils/dateUtils.js';

let currentStreak = 0;
let todayCheckedIn = false;
let longestStreak = 0;

/**
 * Initialize: determine current streak and today's status.
 */
export async function init() {
  const today = formatDate(new Date());
  const todayEntry = await db.get('checkin', today);
  todayCheckedIn = !!todayEntry?.checkedIn;

  currentStreak = await _computeStreak();
  longestStreak = await _getLongestStreak();
}

/**
 * Check in today. Returns { alreadyCheckedIn, streak, xpBonus }.
 */
export async function checkInToday() {
  if (todayCheckedIn) {
    return { alreadyCheckedIn: true, streak: currentStreak, xpBonus: 0 };
  }

  const today = formatDate(new Date());

  // Determine check-in number (position in current streak)
  const yesterday = _getYesterday();
  const yesterdayEntry = await db.get('checkin', yesterday);

  const checkinNumber = yesterdayEntry ? (yesterdayEntry.checkinNumber + 1) : 1;

  // XP bonus tiers
  const xpBonus = checkinNumber >= 30 ? 50 :
                  checkinNumber >= 7 ? 20 :
                  checkinNumber >= 3 ? 10 : 5;

  const entry = {
    date: today,
    checkedIn: true,
    checkinNumber,
    xpBonus
  };

  await db.put('checkin', entry);

  todayCheckedIn = true;
  currentStreak = checkinNumber;

  // Update longest streak
  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  // Award check-in XP to leaderboard
  await _addXP(xpBonus);

  return { alreadyCheckedIn: false, streak: currentStreak, xpBonus };
}

/**
 * Get current streak.
 */
export function getCurrentStreak() {
  return currentStreak;
}

/**
 * Get longest streak ever.
 */
export function getLongestStreak() {
  return longestStreak;
}

/**
 * Is today already checked in?
 */
export function isTodayCheckedIn() {
  return todayCheckedIn;
}

/**
 * Compute the current streak by walking backwards from today.
 */
async function _computeStreak() {
  const today = formatDate(new Date());
  const todayEntry = await db.get('checkin', today);

  // If checked in today, use its checkinNumber
  if (todayEntry?.checkedIn) {
    return todayEntry.checkinNumber;
  }

  // Otherwise walk backwards to find last check-in
  let streak = 0;
  const d = new Date();
  d.setDate(d.getDate() - 1); // start from yesterday

  // Only count a streak if yesterday was checked in (missed today = streak broken?)
  // Actually, let's be generous: if yesterday was checked in, show that streak
  const yesterday = formatDate(d);
  const yesterdayEntry = await db.get('checkin', yesterday);
  if (yesterdayEntry?.checkedIn) {
    return yesterdayEntry.checkinNumber;
  }

  return 0;
}

async function _getLongestStreak() {
  const all = await db.getAll('checkin');
  let max = 0;
  for (const entry of all) {
    if (entry.checkinNumber > max) {
      max = entry.checkinNumber;
    }
  }
  return max;
}

function _getYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return formatDate(d);
}

async function _addXP(xp) {
  const entry = await db.get('leaderboard', 'default');
  if (entry) {
    entry.totalXP = (entry.totalXP || 0) + xp;
    entry.currentStreak = currentStreak;
    if (currentStreak > (entry.longestStreak || 0)) {
      entry.longestStreak = currentStreak;
    }
    entry.lastActiveAt = Date.now();
    await db.put('leaderboard', entry);
  } else {
    await db.put('leaderboard', {
      playerName: 'default',
      totalXP: xp,
      masteryCount: 0,
      currentStreak,
      longestStreak: currentStreak,
      totalBadges: 0,
      lastActiveAt: Date.now(),
      levelsCompleted: 0
    });
  }
}

/**
 * Update leaderboard stats after quiz completion.
 */
export async function updateLeaderboardStats(stats) {
  const entry = await db.get('leaderboard', 'default');
  if (entry) {
    entry.totalXP = (entry.totalXP || 0) + (stats.totalXP || 0);
    entry.masteryCount = stats.masteryCount || entry.masteryCount || 0;
    entry.levelsCompleted = stats.levelsCompleted || entry.levelsCompleted || 0;
    entry.totalBadges = stats.totalBadges || entry.totalBadges || 0;
    entry.currentStreak = currentStreak;
    if (currentStreak > (entry.longestStreak || 0)) {
      entry.longestStreak = currentStreak;
    }
    entry.lastActiveAt = Date.now();
    await db.put('leaderboard', entry);
  }
}

/**
 * Get leaderboard data.
 */
export async function getLeaderboard() {
  const entry = await db.get('leaderboard', 'default');
  if (entry) return [entry];
  return [];
}
