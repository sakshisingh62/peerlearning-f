/**
 * Database Layer - MERN Stack with MongoDB
 * All database operations now go through backend API
 */

import { userAPI, sessionAPI, feedbackAPI, certificateAPI, badgeAPI } from '../services/api';

// Export API with backward-compatible names
export const userDB = userAPI;
export const sessionDB = sessionAPI;
export const feedbackDB = feedbackAPI;
export const certificateDB = certificateAPI;
export const badgeDB = badgeAPI;

// Attendee operations
export const attendeeDB = {
  async addAttendee(sessionId, userId) {
    return await sessionAPI.addAttendee(sessionId, userId);
  },
  async getAttendees(sessionId) {
    const session = await sessionAPI.getSession(sessionId);
    return session?.attendees || [];
  },
  async isAttending(sessionId, userId) {
    const session = await sessionAPI.getSession(sessionId);
    return session?.attendees?.includes(userId) || false;
  }
};

// Points operations
export const pointsDB = {
  async addPoints(userId, points) {
    await userAPI.updateUserPoints(userId, points);
  },
  async getUserPoints(userId) {
    const user = await userAPI.getUser(userId);
    return user?.totalPoints || 0;
  }
};

// Skill progress operations (TODO: implement backend routes)
export const skillProgressDB = {
  async updateSkillProgress() {
    console.log('TODO: Skill progress backend route');
  },
  async getUserSkillProgress(userId) {
    return [];
  }
};

// Sync queue (no longer needed with MongoDB)
export const syncQueueDB = {
  async addToQueue() {},
  async getUnsynced() { return []; },
  async markAsSynced() {},
  async clearSynced() {}
};

const db = {
  user: userAPI,
  session: sessionAPI,
  feedback: feedbackAPI,
  certificate: certificateAPI,
  badge: badgeAPI
};

export default db;

console.log('✅ Using MongoDB backend (no IndexedDB/Dexie)');
