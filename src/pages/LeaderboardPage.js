/**
 * Leaderboard Page
 * Top peer mentors and learners
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal } from 'lucide-react';
import { userDB } from '../db/database';

function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const users = await userDB.getAllUsers();
      const sorted = users.sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
      setLeaderboard(sorted.slice(0, 50));
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
    setLoading(false);
  };

  const getMedalEmoji = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `${rank}`;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.4, ease: 'easeOut' }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pb-12"
    >
      <div className="max-w-5xl mx-auto px-4 pt-8">
        {/* Header */}
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="text-yellow-400" size={40} />
            <h1 className="text-4xl font-bold text-white">Leaderboard</h1>
            <Trophy className="text-yellow-400" size={40} />
          </div>
          <p className="text-gray-400 text-lg">
            Top peer mentors by points earned
          </p>
        </motion.div>

        {/* Leaderboard Table */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-4 border-purple-300 border-t-white rounded-full"
            />
          </div>
        ) : leaderboard.length > 0 ? (
          <motion.div
            className="space-y-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {leaderboard.map((user, index) => (
              <motion.div
                key={`${user?.userId || user?.email || user?.name || 'user'}-${index}`}
                variants={itemVariants}
                whileHover={{ x: 8, scale: 1.02 }}
                className={`glass rounded-xl p-6 border transition-all ${
                  index < 3
                    ? 'border-yellow-500/40 bg-yellow-500/5'
                    : 'border-purple-500/20 hover:border-purple-500/40'
                }`}
              >
                <div className="flex items-center gap-6">
                  {/* Rank */}
                  <div className={`text-4xl font-bold w-16 text-center ${
                    index === 0 ? 'text-yellow-400' :
                    index === 1 ? 'text-gray-400' :
                    index === 2 ? 'text-orange-400' :
                    'text-purple-400'
                  }`}>
                    {getMedalEmoji(index + 1)}
                  </div>

                  {/* User Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-400">
                        <img
                          src={(() => {
                            const isGoogleUser = user?.authProvider === 'google';
                            if (isGoogleUser) return user.profilePicture || user.photoURL || '';
                            return user.profilePicture || user.photoURL || `https://i.pravatar.cc/150?u=${user.userId}`;
                          })()}
                          alt={user.name}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            const isGoogleUser = user?.authProvider === 'google';
                            if (isGoogleUser) {
                              e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150"><rect width="100%" height="100%" fill="%23374151"/><text x="50%" y="50%" fill="%239CA3AF" font-size="36" text-anchor="middle" dominant-baseline="middle">?</text></svg>';
                            } else {
                              e.currentTarget.src = `https://i.pravatar.cc/150?u=${user.userId}`;
                            }
                          }}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-bold text-white text-lg">{user.name}</p>
                        <p className="text-gray-400 text-sm">
                          {user.sessionsCreated} sessions • {user.sessionsAttended} learned
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Points */}
                  <div className="text-center">
                    <p className="text-3xl font-bold gradient-text">
                      {user.totalPoints || 0}
                    </p>
                    <p className="text-gray-400 text-sm">Points</p>
                  </div>

                  {/* Badges Preview */}
                  <div className="hidden sm:flex items-center gap-2">
                    {user.badges && user.badges.length > 0 ? (
                      user.badges.slice(0, 2).map((badge, idx) => (
                        <motion.div
                          key={`${badge}-${idx}`}
                          whileHover={{ scale: 1.2 }}
                          className="text-2xl"
                          title={badge}
                        >
                          {badge.split(' ')[0]}
                        </motion.div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-sm">No badges yet</p>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4 w-full bg-gray-700/30 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((user.totalPoints || 0) / 100 * 100, 100)}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: index * 0.02 }}
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Medal className="w-16 h-16 text-gray-600 mx-auto mb-4 opacity-50" />
            <p className="text-gray-400 text-lg">
              No peer mentors yet. Be the first to create a session!
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export default LeaderboardPage;
