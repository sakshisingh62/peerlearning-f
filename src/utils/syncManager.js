/**
 * Sync Manager
 * Handles syncing offline data with backend when online
 */

import axios from 'axios';
import { syncQueueDB } from '../db/database';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
console.log('SyncManager: Using API_BASE_URL:', API_BASE_URL);   //debug

export const syncManager = {
  // Check if online
  isOnline: () => {
    return navigator.onLine;
  },

  // Sync offline data with backend
  async syncData(userId) {
    if (!this.isOnline()) {
      console.log('Offline - sync queued');
      return { success: false, message: 'No internet connection' };
    }

    try {
      const unsynced = await syncQueueDB.getUnsynced();

      if (unsynced.length === 0) {
        return { success: true, message: 'Nothing to sync' };
      }

      // Group by user
      const userUnsynced = unsynced.filter(item => item.userId === userId);

      if (userUnsynced.length === 0) {
        return { success: true, message: 'No data to sync for this user' };
      }

      // Send to backend
      const response = await axios.post(`${API_BASE_URL}/sync`, {
        userId,
        data: userUnsynced.map(item => ({
          type: item.dataType,
          _id: item.data._id,
          data: item.data
        }))
      });

      // Mark as synced
      for (const item of userUnsynced) {
        await syncQueueDB.markAsSynced(item.id);
      }

      console.log(`Synced ${userUnsynced.length} items`);
      return { success: true, message: `Synced ${userUnsynced.length} items` };
    } catch (error) {
      console.error('Sync error:', error);
      return { success: false, message: error.message };
    }
  },

  // Listen for online/offline events
  setupSyncListener() {
    window.addEventListener('online', async () => {
      console.log('Back online - attempting sync');
      const userId = localStorage.getItem('userId');
      if (userId) {
        await this.syncData(userId);
      }
    });

    window.addEventListener('offline', () => {
      console.log('Offline - data will sync when online');
    });
  }
};

export default syncManager;
