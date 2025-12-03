/**
 * Profile Page
 * User profile with stats and badges
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Award, TrendingUp, Zap, Edit2, Save, X } from 'lucide-react';
import { badgeDB, certificateDB, skillProgressDB, userDB } from '../db/database';
import { userAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

function ProfilePage({ currentUser }) {
  const navigate = useNavigate();
  const [badges, setBadges] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [skillProgress, setSkillProgress] = useState([]);
  const [updatedUser, setUpdatedUser] = useState(currentUser);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editedName, setEditedName] = useState(currentUser?.name || '');

  const loadProfileData = useCallback(async () => {
    setLoading(true);
    try {
      if (currentUser) {
        const userBadges = await badgeDB.getUserBadges(currentUser.userId);
        setBadges(userBadges);

        const userCerts = await certificateDB.getUserCertificates(currentUser.userId);
        setCertificates(userCerts);

        const userSkills = await skillProgressDB.getUserSkillProgress(currentUser.userId);
        setSkillProgress(userSkills);

        const latestUser = await userDB.getUser(currentUser.userId);
        if (latestUser) {
          setUpdatedUser(latestUser);
          console.log("latestUser", latestUser);
          setEditedName(latestUser.name);
        }

        // If we're online, and this is a Google-authenticated account (or the local record
        // lacks a profilePicture), try to fetch the authoritative user object from the server
        // (the backend stores the Google `picture` URL). Update local state and sync local DB.
        if (navigator.onLine && currentUser) {
          const shouldRefreshFromServer = (currentUser?.authProvider === 'google') || !latestUser?.profilePicture;
          if (shouldRefreshFromServer) {
            try {
              const serverUser = await userAPI.getUser(currentUser.userId);
              if (serverUser) {
                // prefer server-side fields (especially profilePicture and authProvider)
                setUpdatedUser(serverUser);
                setEditedName(serverUser.name || editedName);
                // sync to local IndexedDB/local userDB so subsequent offline loads reflect the change
                try {
                  await userDB.upsertUser(serverUser);
                } catch (upsertErr) {
                  // non-fatal: log and continue
                  console.warn('ProfilePage: failed to sync server user to local DB', upsertErr);
                }
                console.log('ProfilePage: refreshed user from server', serverUser);
              }
            } catch (err) {
              console.warn('ProfilePage: could not fetch server user', err);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      // Redirect to login if no user
      navigate('/login');
      return;
    }
    loadProfileData();
  }, [loadProfileData, navigate]);

  const handleSaveProfile = async () => {
    try {
      await userDB.upsertUser({
        ...updatedUser,
        name: editedName.trim()
      });

      const refreshedUser = await userDB.getUser(currentUser.userId);
      setUpdatedUser(refreshedUser);
      console.log("setUpdateUser", refreshedUser)
      setEditMode(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditedName(updatedUser.name);
    setEditMode(false);
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-xl">Loading profile data...</p>
        </div>
      </div>
    );
  }

  //Adding
  // Determine if user is Google-authenticated
  const isGoogleUser =
    updatedUser?.authProvider === 'google' ||
    currentUser?.authProvider === 'google';

  // Safely handle Google photo URLs (autosizing)
  const getGooglePhoto = (url) => {
    if (!url) return '';
    if (!url.startsWith('https://lh3.googleusercontent.com')) return url;
    return url.includes('=') ? url : `${url}=s200-c`;
  };

  // Final avatar URL (shared by src & onError)
  const avatarUrl = (() => {
    if (isGoogleUser) {
      return (
        getGooglePhoto(currentUser?.photoURL) ||
        getGooglePhoto(currentUser?.profilePicture) ||
        getGooglePhoto(updatedUser?.profilePicture) ||
        ''
      );
    }

    return (
      updatedUser?.profilePicture ||
      currentUser?.profilePicture ||
      currentUser?.photoURL ||
      `https://i.pravatar.cc/150?u=${currentUser?.userId || currentUser?.email}`
    );
  })();


  // No animation variants — simplified without framer-motion

  return (
    <div className="min-h-screen pb-12">
      <div className="max-w-6xl mx-auto px-4 pt-8">
        {/* Profile Header */}
        <div className="glass rounded-2xl p-8 border border-purple-500/20 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Avatar */}
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-purple-400 shadow-lg">
              <img
                src={avatarUrl}
                alt={updatedUser?.name || currentUser?.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  e.currentTarget.onerror = null;

                  const fallback = isGoogleUser
                    ? 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150"><rect width="100%" height="100%" fill="%23374151"/><text x="50%" y="50%" fill="%239CA3AF" font-size="36" text-anchor="middle" dominant-baseline="middle">?</text></svg>'
                    : `https://i.pravatar.cc/150?u=${currentUser?.userId || currentUser?.email}`;

                  e.currentTarget.src = fallback;
                }}
              />


            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              {editMode ? (
                <div className="mb-4">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="text-4xl font-bold bg-slate-800/50 border border-purple-500/30 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500 w-full md:w-auto"
                    placeholder="Your name"
                  />
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={handleSaveProfile}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                    >
                      <Save size={18} />
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                    >
                      <X size={18} />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold text-white">{updatedUser?.name || currentUser.name}</h1>
                  <button
                    onClick={() => setEditMode(true)}
                    className="text-purple-400 hover:text-purple-300 transition-colors"
                    title="Edit name"
                  >
                    <Edit2 size={20} />
                  </button>
                </div>
              )}
              <p className="text-gray-400 mb-4">{currentUser.email}</p>
              <p className="text-purple-300 mb-6">
                Member since {new Date(updatedUser?.createdAt || currentUser.createdAt || Date.now()).toLocaleDateString()}
              </p>

              {/* Quick Stats */}
              <div className="flex flex-wrap gap-6 justify-center md:justify-start">
                <div
                  className="text-center bg-purple-500/10 px-4 py-3 rounded-lg border border-purple-500/20"
                >
                  <p className="text-3xl font-bold text-purple-400">
                    {updatedUser?.totalPoints || 0}
                  </p>
                  <p className="text-gray-400 text-sm">Peer Points</p>
                </div>
                <div
                  className="text-center bg-blue-500/10 px-4 py-3 rounded-lg border border-blue-500/20"
                >
                  <p className="text-3xl font-bold text-blue-400">
                    {updatedUser?.sessionsCreated || 0}
                  </p>
                  <p className="text-gray-400 text-sm">Sessions Created</p>
                </div>
                <div
                  className="text-center bg-green-500/10 px-4 py-3 rounded-lg border border-green-500/20"
                >
                  <p className="text-3xl font-bold text-green-400">
                    {updatedUser?.sessionsAttended || 0}
                  </p>
                  <p className="text-gray-400 text-sm">Sessions Attended</p>
                </div>
                <div
                  className="text-center bg-yellow-500/10 px-4 py-3 rounded-lg border border-yellow-500/20"
                >
                  <p className="text-3xl font-bold text-yellow-400">
                    {badges.length}
                  </p>
                  <p className="text-gray-400 text-sm">Badges Earned</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Badges Section */}
        <div className="glass rounded-2xl p-8 border border-purple-500/20 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Award className="text-yellow-400" size={28} />
            <h2 className="text-2xl font-bold text-white">Badges & Achievements</h2>
          </div>

          {badges.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {badges.map((badge, index) => (
                <div
                  key={badge.id}
                  className="glass rounded-lg p-6 text-center border border-yellow-500/20 hover:border-yellow-500/40 transition-all"
                >
                  <p className="text-4xl mb-2">{badge.badgeName.charAt(0)}</p>
                  <p className="font-bold text-white mb-1">{badge.badgeName}</p>
                  <p className="text-gray-400 text-xs">
                    Earned {new Date(badge.earnedAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-2">No badges yet</p>
              <p className="text-gray-500 text-sm">
                Teach sessions and get good feedback to earn badges!
              </p>
            </div>
          )}
        </div>

        {/* Certificates Section */}
        <div className="glass rounded-2xl p-8 border border-purple-500/20 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Zap className="text-purple-400" size={28} />
            <h2 className="text-2xl font-bold text-white">Certificates</h2>
          </div>

          {certificates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certificates.map((cert, index) => (
                <div
                  key={cert.id}
                  className="glass rounded-lg p-6 border border-purple-500/20 hover:border-purple-500/40 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="font-semibold text-purple-300 text-sm uppercase">
                        {cert.certificateType === 'peer-mentor'
                          ? '👨‍🏫 Peer Mentor'
                          : '⭐ Outstanding Helper'}
                      </p>
                      <p className="text-white font-bold mt-1">{cert.sessionTitle}</p>
                    </div>
                    <p className="text-3xl">
                      {cert.certificateType === 'peer-mentor' ? '👨‍🏫' : '⭐'}
                    </p>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Issued {new Date(cert.issuedDate).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-2">No certificates yet</p>
              <p className="text-gray-500 text-sm">
                Complete sessions to earn certificates!
              </p>
            </div>
          )}
        </div>

        {/* Skills Section */}
        {skillProgress.length > 0 && (
          <div className="glass rounded-2xl p-8 border border-purple-500/20">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="text-green-400" size={28} />
              <h2 className="text-2xl font-bold text-white">Skills Progress</h2>
            </div>

            <div className="space-y-4">
              {skillProgress.map((skill, index) => (
                <div
                  key={skill.id}
                  className="glass rounded-lg p-4 border border-purple-500/20"
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-semibold text-white">{skill.skillName}</p>
                    <p className="text-green-400 font-bold">{skill.pointsEarned} pts</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-400">
                        {skill.sessionsTeaching}
                      </p>
                      <p className="text-gray-400 text-xs">Teaching</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-400">
                        {skill.sessionsLearning}
                      </p>
                      <p className="text-gray-400 text-xs">Learning</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfilePage;
