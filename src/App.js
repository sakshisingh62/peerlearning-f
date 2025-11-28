/**
 * Main App Component
 * Offline-First Peer Learning Session Manager
 */

import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import HomePage from './pages/HomePage';
import SessionListPage from './pages/SessionListPage';
import SessionDetailPage from './pages/SessionDetailPage';
import CreateSessionPage from './pages/CreateSessionPage';
import ProfilePage from './pages/ProfilePage';
import LeaderboardPage from './pages/LeaderboardPage';
import SkillGraphPage from './pages/SkillGraphPage';
import CertificatesPage from './pages/CertificatesPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import { userAPI } from './services/api';
import syncManager from './utils/syncManager';
import './index.css';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Initialize current user
    const userId = localStorage.getItem('userId');
    console.log('App.js: Checking for userId in localStorage:', userId);
    
    // Check for Google login success
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('login') === 'success') {
      // Fetch user from backend
      fetch('http://localhost:5000/auth/user', { credentials: 'include' })
        .then(res => res.json())
        .then(user => {
          if (user && !user.message) {
            localStorage.setItem('userId', user.userId);
            localStorage.setItem('currentUser', JSON.stringify(user));
            setCurrentUser(user);
            console.log('App.js: Google login user set:', user);
          }
        })
        .catch(err => console.error('Failed to fetch Google user:', err));
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    
    // If a full currentUser is stored locally (fallback for offline/guest), use it immediately
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCurrentUser(parsed);
        console.log('App.js: Loaded currentUser from localStorage fallback', parsed);
      } catch (e) {
        console.warn('App.js: Failed to parse currentUser from localStorage', e);
      }
    }

    // If we're online, try to refresh authoritative user from server (ensures Google photo is synced)
    // Only do this when the local user has a placeholder avatar or none (preserve offline behavior)
    if (navigator.onLine) {
      try {
        const local = localStorage.getItem('currentUser');
        const localUser = local ? JSON.parse(local) : null;
        const needsRefresh = !localUser || !localUser.profilePicture || (localUser.profilePicture && localUser.profilePicture.includes('i.pravatar.cc'));

        if (needsRefresh) {
          console.log('App.js: Refreshing currentUser from server to sync Google profile photo');
          fetch('http://localhost:5000/auth/user', { credentials: 'include' })
            .then(res => {
              if (!res.ok) throw new Error('Not authenticated');
              return res.json();
            })
            .then(user => {
              if (user && !user.message) {
                localStorage.setItem('userId', user.userId);
                localStorage.setItem('currentUser', JSON.stringify(user));
                setCurrentUser(user);
                console.log('App.js: currentUser refreshed from server', user);
              }
            })
            .catch(() => {
              // ignore; user may not be authenticated
            });
        }
      } catch (err) {
        // ignore parse errors
      }
    }

    if (userId) {
      loadUser(userId);
    } else {
      console.log('App.js: No userId found in localStorage');
      setLoading(false);
    }

    // Service Worker: only register in production to avoid dev/HMR issues
    if ('serviceWorker' in navigator) {
      if (process.env.NODE_ENV === 'production') {
        navigator.serviceWorker
          .register('/service-worker.js')
          .then(() => console.log('Service Worker registered'))
          .catch(err => console.log('Service Worker registration failed:', err));
      } else {
        // In development, proactively unregister any existing SW and clear old caches to prevent stale assets and WS issues
        navigator.serviceWorker.getRegistrations()
          .then(regs => regs.forEach(r => r.unregister()))
          .catch(() => {});
        if (window.caches && window.caches.keys) {
          window.caches.keys()
            .then(keys => Promise.all(keys.map(k => window.caches.delete(k))))
            .catch(() => {});
        }
      }
    }

    // Setup sync listener
    syncManager.setupSyncListener();

    // Monitor online/offline
    window.addEventListener('online', () => {
      setIsOnline(true);
      console.log('✓ Online');
    });
    window.addEventListener('offline', () => {
      setIsOnline(false);
      console.log('✗ Offline');
    });
  }, []);

  const loadUser = async (userId) => {
    try {
      console.log('App.js: Loading user with userId:', userId);
      const user = await userAPI.getUser(userId);
      console.log('App.js: User loaded from API:', user);
      
      if (user && !user.message) {
        setCurrentUser(user);
        console.log('App.js: Current user set:', user);
      } else {
        console.log('App.js: User not found, clearing localStorage');
        localStorage.removeItem('userId');
        localStorage.removeItem('currentUser');
      }
    } catch (error) {
      console.error('App.js: Error loading user:', error);
      // Keep local currentUser if present (offline/guest). Only remove userId if we have no fallback.
      const stored = localStorage.getItem('currentUser');
      if (!stored) {
        localStorage.removeItem('userId');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (user) => {
    console.log('App.js: handleLogin called with user:', user);
    localStorage.setItem('userId', user.userId);
    localStorage.setItem('currentUser', JSON.stringify(user));
    setCurrentUser(user);
  };

  const handleLogout = () => {
    console.log('App.js: handleLogout called');
    localStorage.removeItem('userId');
    setCurrentUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-16 h-16 border-4 border-purple-300 border-t-white rounded-full"
        />
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        {/* Online/Offline Indicator */}
        <AnimatePresence>
          {!isOnline && (
            <motion.div
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              className="fixed top-0 left-0 right-0 bg-red-500 text-white py-3 text-center z-50 shadow-lg"
            >
              <span className="flex items-center justify-center gap-2">
                <span className="w-3 h-3 bg-white rounded-full animate-pulse" />
                You are offline - all data is saved locally
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <Navbar currentUser={currentUser} isOnline={isOnline} onLogout={handleLogout} />

        <main className={isOnline ? '' : 'mt-12'}>
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
              <Route path="/signup" element={<SignupPage onLogin={handleLogin} />} />
              
              {/* Protected Routes - Require Login */}
              <Route 
                path="/" 
                element={
                  <PrivateRoute currentUser={currentUser}>
                    <HomePage currentUser={currentUser} />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/sessions" 
                element={
                  <PrivateRoute currentUser={currentUser}>
                    <SessionListPage currentUser={currentUser} />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/sessions/:sessionId" 
                element={
                  <PrivateRoute currentUser={currentUser}>
                    <SessionDetailPage currentUser={currentUser} />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/create-session" 
                element={
                  <PrivateRoute currentUser={currentUser}>
                    <CreateSessionPage currentUser={currentUser} />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <PrivateRoute currentUser={currentUser}>
                    <ProfilePage currentUser={currentUser} />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/leaderboard" 
                element={
                  <PrivateRoute currentUser={currentUser}>
                    <LeaderboardPage />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/skills" 
                element={
                  <PrivateRoute currentUser={currentUser}>
                    <SkillGraphPage currentUser={currentUser} />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/certificates" 
                element={
                  <PrivateRoute currentUser={currentUser}>
                    <CertificatesPage currentUser={currentUser} />
                  </PrivateRoute>
                } 
              />
              
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </Router>
  );
}

export default App;
