/**
 * Offline Utils
 * Additional utilities for offline functionality
 */

export const offlineUtils = {
  // Check if data has been synced
  async isDataSynced(dataId) {
    try {
      // Check if item exists in sync queue as unsynced
      const { db } = await import('../db/database');
      const item = await db.syncQueue
        .where('id').equals(dataId)
        .filter(i => !i.synced)
        .first();
      return !item;
    } catch (error) {
      console.error('Error checking sync status:', error);
      return false;
    }
  },

  // Get sync statistics
  async getSyncStats() {
    try {
      const { syncQueueDB } = await import('../db/database');
      const unsynced = await syncQueueDB.getUnsynced();
      
      return {
        unsynced: unsynced.length,
        pendingActions: unsynced.reduce((acc, item) => {
          acc[item.dataType] = (acc[item.dataType] || 0) + 1;
          return acc;
        }, {})
      };
    } catch (error) {
      console.error('Error getting sync stats:', error);
      return { unsynced: 0, pendingActions: {} };
    }
  },

  // Format storage size
  formatStorageSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  },

  // Check storage availability
  async checkStorage() {
    try {
      if (navigator.storage && navigator.storage.estimate) {
        const estimate = await navigator.storage.estimate();
        return {
          usage: estimate.usage,
          quota: estimate.quota,
          percentage: (estimate.usage / estimate.quota) * 100,
          available: estimate.quota - estimate.usage
        };
      }
    } catch (error) {
      console.error('Error checking storage:', error);
    }
    return null;
  },

  // Clear all offline data (for testing/reset)
  async clearAllData() {
    try {
      const { db } = await import('../db/database');
      
      await db.users.clear();
      await db.sessions.clear();
      await db.attendees.clear();
      await db.feedback.clear();
      await db.points.clear();
      await db.certificates.clear();
      await db.badges.clear();
      await db.skillProgress.clear();
      await db.syncQueue.clear();

      localStorage.clear();
      console.log('✓ All data cleared');
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      return false;
    }
  },

  // Export data as JSON for backup
  async exportData() {
    try {
      const { db } = await import('../db/database');

      const data = {
        users: await db.users.toArray(),
        sessions: await db.sessions.toArray(),
        attendees: await db.attendees.toArray(),
        feedback: await db.feedback.toArray(),
        points: await db.points.toArray(),
        certificates: await db.certificates.toArray(),
        badges: await db.badges.toArray(),
        skillProgress: await db.skillProgress.toArray(),
        syncQueue: await db.syncQueue.toArray(),
        exportDate: new Date().toISOString()
      };

      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `navpeer-backup-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      console.error('Error exporting data:', error);
      return false;
    }
  },

  // Import data from JSON backup
  async importData(file) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const { db } = await import('../db/database');

      // Clear existing data
      await this.clearAllData();

      // Import data
      if (data.users) await db.users.bulkAdd(data.users);
      if (data.sessions) await db.sessions.bulkAdd(data.sessions);
      if (data.attendees) await db.attendees.bulkAdd(data.attendees);
      if (data.feedback) await db.feedback.bulkAdd(data.feedback);
      if (data.points) await db.points.bulkAdd(data.points);
      if (data.certificates) await db.certificates.bulkAdd(data.certificates);
      if (data.badges) await db.badges.bulkAdd(data.badges);
      if (data.skillProgress) await db.skillProgress.bulkAdd(data.skillProgress);
      if (data.syncQueue) await db.syncQueue.bulkAdd(data.syncQueue);

      console.log('✓ Data imported successfully');
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }
};

export default offlineUtils;
