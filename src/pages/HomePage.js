/**
 * Home Page
 * Welcome screen and quick access
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, Users, Award, BookOpen } from 'lucide-react';
import { sessionDB, userDB } from '../db/database';

function HomePage({ currentUser }) {
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalUsers: 0,
    sessionsAttended: 0,
    pointsEarned: 0
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const sessions = await sessionDB.getAllSessions();
    const users = await userDB.getAllUsers();
    
    setStats({
      totalSessions: sessions.length,
      totalUsers: users.length,
      sessionsAttended: currentUser?.sessionsAttended || 0,
      pointsEarned: currentUser?.totalPoints || 0
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' }
    }
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Hero Section */}
      <motion.section
        className="relative pt-20 pb-32 px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-5xl mx-auto text-center">
          <motion.h1
            className="text-5xl md:text-6xl font-bold mb-6 gradient-text"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            Peer Learning Sessions
          </motion.h1>
          
          <motion.p
            className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
          >
            Learn from your peers. Teach what you know. Grow together. 100% Offline-First.
          </motion.p>

          <motion.div
            className="flex flex-wrap justify-center gap-4 mb-12"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Link
              to="/sessions"
              className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition-all hover:-translate-y-1 flex items-center gap-2"
            >
              Explore Sessions
              <ArrowRight size={20} />
            </Link>
            <Link
              to="/create-session"
              className="bg-white/10 text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/20 transition-all border border-white/20"
            >
              Create Session
            </Link>
          </motion.div>
        </div>

        {/* Floating cards background */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <motion.div
            className="absolute top-10 left-10 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl"
            animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
            transition={{ duration: 8, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-10 right-10 w-72 h-72 bg-pink-600/20 rounded-full blur-3xl"
            animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
            transition={{ duration: 8, repeat: Infinity, delay: 0.5 }}
          />
        </div>
      </motion.section>

      {/* Stats Section */}
      <section className="max-w-6xl mx-auto px-4 mb-16">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div
            className="glass rounded-xl p-6 text-center hover:bg-purple-500/10 transition-all"
            variants={itemVariants}
            whileHover={{ y: -5 }}
          >
            <div className="text-4xl font-bold gradient-text mb-2">
              {stats.totalSessions}
            </div>
            <div className="text-gray-400">Total Sessions</div>
          </motion.div>

          <motion.div
            className="glass rounded-xl p-6 text-center hover:bg-purple-500/10 transition-all"
            variants={itemVariants}
            whileHover={{ y: -5 }}
          >
            <div className="text-4xl font-bold gradient-text mb-2">
              {stats.totalUsers}
            </div>
            <div className="text-gray-400">Active Learners</div>
          </motion.div>

          <motion.div
            className="glass rounded-xl p-6 text-center hover:bg-purple-500/10 transition-all"
            variants={itemVariants}
            whileHover={{ y: -5 }}
          >
            <div className="text-4xl font-bold gradient-text mb-2">
              {stats.sessionsAttended}
            </div>
            <div className="text-gray-400">Your Sessions</div>
          </motion.div>

          <motion.div
            className="glass rounded-xl p-6 text-center hover:bg-purple-500/10 transition-all"
            variants={itemVariants}
            whileHover={{ y: -5 }}
          >
            <div className="text-4xl font-bold gradient-text mb-2">
              {stats.pointsEarned}
            </div>
            <div className="text-gray-400">Peer Points</div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto px-4 mb-16">
        <motion.h2
          className="text-3xl font-bold text-center mb-12 text-white"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          Key Features
        </motion.h2>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <Link to="/sessions">
            <motion.div
              className="glass rounded-xl p-6 border border-purple-500/20 card-hover cursor-pointer"
              variants={itemVariants}
              whileHover={{ y: -8, scale: 1.02 }}
            >
              <Zap className="w-10 h-10 text-yellow-400 mb-4" />
              <h3 className="font-bold text-white mb-2">100% Offline</h3>
              <p className="text-gray-400 text-sm">
                Works completely offline. No internet needed.
              </p>
            </motion.div>
          </Link>

          <Link to="/sessions">
            <motion.div
              className="glass rounded-xl p-6 border border-purple-500/20 card-hover cursor-pointer"
              variants={itemVariants}
              whileHover={{ y: -8, scale: 1.02 }}
            >
              <Users className="w-10 h-10 text-blue-400 mb-4" />
              <h3 className="font-bold text-white mb-2">Peer Teaching</h3>
              <p className="text-gray-400 text-sm">
                Students teach students. Everyone learns together.
              </p>
            </motion.div>
          </Link>

          <Link to="/certificates">
            <motion.div
              className="glass rounded-xl p-6 border border-purple-500/20 card-hover cursor-pointer"
              variants={itemVariants}
              whileHover={{ y: -8, scale: 1.02 }}
            >
              <Award className="w-10 h-10 text-green-400 mb-4" />
              <h3 className="font-bold text-white mb-2">Earn Badges</h3>
              <p className="text-gray-400 text-sm">
                Get recognized with badges and certificates.
              </p>
            </motion.div>
          </Link>

          <Link to="/skill-graph">
            <motion.div
              className="glass rounded-xl p-6 border border-purple-500/20 card-hover cursor-pointer"
              variants={itemVariants}
              whileHover={{ y: -8, scale: 1.02 }}
            >
              <BookOpen className="w-10 h-10 text-pink-400 mb-4" />
              <h3 className="font-bold text-white mb-2">Track Progress</h3>
              <p className="text-gray-400 text-sm">
                See your growth with detailed skill graphs.
              </p>
            </motion.div>
          </Link>
        </motion.div>
      </section>

      {/* CTA Section */}
      <motion.section
        className="max-w-4xl mx-auto px-4 py-16 glass rounded-2xl border border-purple-500/20 text-center"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
      >
        <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
        <p className="text-gray-300 mb-8">
          Create your first session or join existing ones to start your peer learning journey.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="/sessions"
            className="bg-purple-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-purple-600 transition-all"
          >
            Browse Sessions
          </Link>
          <Link
            to="/create-session"
            className="bg-pink-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-pink-600 transition-all"
          >
            Create First Session
          </Link>
        </div>
      </motion.section>
    </div>
  );
}

export default HomePage;
