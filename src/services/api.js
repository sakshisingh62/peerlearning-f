/**
 * API Service - Frontend HTTP Client
 * Replaces IndexedDB with MongoDB backend calls
 */

import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// ==================== User API ====================

export const userAPI = {
  // Get all users
  async getAllUsers() {
    try {
      const response = await api.get('/users');
      return response.data;
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  },

  // Get user by ID
  async getUser(userId) {
    try {
      const response = await api.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  },

  // Create or update user
  async upsertUser(userData) {
    try {
      const response = await api.post('/users', userData);
      return response.data;
    } catch (error) {
      console.error('Error upserting user:', error);
      throw error;
    }
  },

  // Login
  async login(email) {
    try {
      const response = await api.post('/users/login', { email });
      return response.data;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  },

  // Update user points
  async updateUserPoints(userId, points) {
    try {
      const response = await api.patch(`/users/${userId}/points`, { points });
      return response.data.totalPoints;
    } catch (error) {
      console.error('Error updating user points:', error);
    }
  },

  // Increment sessions created
  async incrementSessionsCreated(userId) {
    try {
      await api.patch(`/users/${userId}/sessions-created`);
    } catch (error) {
      console.error('Error incrementing sessions created:', error);
    }
  },

  // Increment sessions attended
  async incrementSessionsAttended(userId) {
    try {
      await api.patch(`/users/${userId}/sessions-attended`);
    } catch (error) {
      console.error('Error incrementing sessions attended:', error);
    }
  }
};

// ==================== Session API ====================

export const sessionAPI = {
  // Create session
  async createSession(sessionData) {
    try {
      console.log('API: Creating session...', sessionData);
      const response = await api.post('/sessions', sessionData);
      console.log('API: Session created successfully', response.data);
      return response.data;
    } catch (error) {
      console.error('API: Error creating session:', error);
      throw error;
    }
  },

  // Get all sessions
  async getAllSessions() {
    try {
      const response = await api.get('/sessions');
      return response.data;
    } catch (error) {
      console.error('Error getting all sessions:', error);
      return [];
    }
  },

  // Get session by ID
  async getSession(sessionId) {
    try {
      const response = await api.get(`/sessions/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  },

  // Get sessions by creator
  async getSessionsByCreator(creatorId) {
    try {
      const response = await api.get(`/sessions/creator/${creatorId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting sessions by creator:', error);
      return [];
    }
  },

  // Filter sessions
  async filterSessions(filters) {
    try {
      const response = await api.post('/sessions/filter', filters);
      return response.data;
    } catch (error) {
      console.error('Error filtering sessions:', error);
      return [];
    }
  },

  // Update session status
  async updateSessionStatus(sessionId, status) {
    try {
      const response = await api.patch(`/sessions/${sessionId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating session status:', error);
    }
  },

  // Add attendee to session
  async addAttendee(sessionId, userId) {
    try {
      const response = await api.post(`/sessions/${sessionId}/attendees`, { userId });
      return response.data;
    } catch (error) {
      console.error('Error adding attendee:', error);
      throw error;
    }
  },

  // Complete session (mark as completed)
  async completeSession(sessionId) {
    try {
      const response = await api.patch(`/sessions/${sessionId}/status`, { status: 'completed' });
      return response.data;
    } catch (error) {
      console.error('Error completing session:', error);
      throw error;
    }
  }
};

// ==================== Feedback API ====================

export const feedbackAPI = {
  // Add feedback
  async addFeedback(feedbackData) {
    try {
      const response = await api.post('/feedback', feedbackData);
      return response.data;
    } catch (error) {
      console.error('Error adding feedback:', error);
      throw error;
    }
  },

  // Get feedback for session
  async getFeedbackForSession(sessionId) {
    try {
      const response = await api.get(`/feedback/session/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting feedback:', error);
      return [];
    }
  },

  // Get feedback by student
  async getFeedbackByStudent(studentId) {
    try {
      const response = await api.get(`/feedback/student/${studentId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting student feedback:', error);
      return [];
    }
  }
};

// ==================== Certificate API ====================

export const certificateAPI = {
  // Create certificate
  async createCertificate(certificateData) {
    try {
      const response = await api.post('/certificates', certificateData);
      return response.data;
    } catch (error) {
      console.error('Error creating certificate:', error);
      throw error;
    }
  },

  // Get user certificates
  async getUserCertificates(userId) {
    try {
      const response = await api.get(`/certificates/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting user certificates:', error);
      return [];
    }
  },

  // Get certificate by ID
  async getCertificate(certificateId) {
    try {
      const response = await api.get(`/certificates/${certificateId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting certificate:', error);
      return null;
    }
  },

  // Get user certificate stats
  async getUserCertificateStats(userId) {
    try {
      const response = await api.get(`/certificates/user/${userId}/stats`);
      return response.data;
    } catch (error) {
      console.error('Error getting certificate stats:', error);
      return { total: 0, byType: {}, averageRating: 0 };
    }
  },

  // Delete certificate
  async deleteCertificate(certificateId) {
    try {
      const response = await api.delete(`/certificates/${certificateId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting certificate:', error);
      throw error;
    }
  }
};

// ==================== Badge API ====================

export const badgeAPI = {
  // Create/Award badge
  async addBadge(badgeData) {
    try {
      const response = await api.post('/badges', badgeData);
      return response.data;
    } catch (error) {
      console.error('Error adding badge:', error);
      throw error;
    }
  },

  // Get user badges
  async getUserBadges(userId) {
    try {
      const response = await api.get(`/badges/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting user badges:', error);
      return [];
    }
  },

  // Get badge by ID
  async getBadge(badgeId) {
    try {
      const response = await api.get(`/badges/${badgeId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting badge:', error);
      return null;
    }
  },

  // Get user badge stats
  async getUserBadgeStats(userId) {
    try {
      const response = await api.get(`/badges/user/${userId}/stats`);
      return response.data;
    } catch (error) {
      console.error('Error getting badge stats:', error);
      return { total: 0, byType: {}, recentBadges: [] };
    }
  },

  // Delete badge
  async deleteBadge(badgeId) {
    try {
      const response = await api.delete(`/badges/${badgeId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting badge:', error);
      throw error;
    }
  }
};

// Export default API object
const apiService = {
  user: userAPI,
  session: sessionAPI,
  feedback: feedbackAPI,
  certificate: certificateAPI,
  badge: badgeAPI
};

export default apiService;
