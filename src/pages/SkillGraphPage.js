/**
 * Skill Graph Page
 * Visualize skill progress with charts
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { sessionDB, skillProgressDB } from '../db/database';

function SkillGraphPage({ currentUser }) {
  const [skillData, setSkillData] = useState([]);
  const [sessionTimeline, setSessionTimeline] = useState([]);
  const [pointsTimeline, setPointsTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGraphData();
  }, [currentUser]);

  const loadGraphData = async () => {
    setLoading(true);
    try {
      if (currentUser) {
        // Load skill progress
        const skills = await skillProgressDB.getUserSkillProgress(currentUser.userId);
        setSkillData(skills);

        // Load sessions timeline
        const sessions = await sessionDB.getSessionsByCreator(currentUser.userId);
        const timeline = sessions.map(s => ({
          date: new Date(s.dateTime).toLocaleDateString(),
          timestamp: new Date(s.dateTime).getTime(),
          title: s.title
        }))
        .sort((a, b) => a.timestamp - b.timestamp)
        .reduce((acc, session, idx) => {
          const existing = acc.find(item => item.date === session.date);
          if (existing) {
            existing.sessions = (existing.sessions || 0) + 1;
          } else {
            acc.push({
              date: session.date,
              sessions: 1
            });
          }
          return acc;
        }, []);
        setSessionTimeline(timeline);

        // Simulate points timeline
        const pointsData = [];
        let totalPoints = currentUser.totalPoints || 0;
        const sessionCount = sessions.length;
        for (let i = 1; i <= Math.min(sessionCount, 10); i++) {
          pointsData.push({
            session: `Session ${i}`,
            points: Math.round((totalPoints / sessionCount) * i)
          });
        }
        setPointsTimeline(pointsData);
      }
    } catch (error) {
      console.error('Error loading graph data:', error);
    }
    setLoading(false);
  };

  const COLORS = ['#a855f7', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-purple-300 border-t-white rounded-full"
        />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pb-12"
    >
      <div className="max-w-6xl mx-auto px-4 pt-8">
        {/* Header */}
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center gap-3 mb-12"
        >
          <TrendingUp className="text-green-400" size={40} />
          <h1 className="text-4xl font-bold text-white">Skills Progress</h1>
        </motion.div>

        {/* Skills Overview */}
        {skillData.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-2xl p-8 border border-purple-500/20 mb-8"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Your Skills</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {skillData.map((skill, index) => (
                <motion.div
                  key={skill.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass rounded-lg p-6 border border-purple-500/20"
                >
                  <p className="font-bold text-white mb-4 text-lg">{skill.skillName}</p>
                  
                  <div className="space-y-4">
                    {/* Teaching Bar */}
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-blue-300 text-sm">Teaching Sessions</span>
                        <span className="text-blue-400 font-bold">{skill.sessionsTeaching}</span>
                      </div>
                      <div className="w-full bg-gray-700/30 rounded-full h-3 overflow-hidden">
                        <motion.div
                          className="h-full bg-blue-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(skill.sessionsTeaching * 20, 100)}%` }}
                          transition={{ duration: 0.8 }}
                        />
                      </div>
                    </div>

                    {/* Learning Bar */}
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-purple-300 text-sm">Learning Sessions</span>
                        <span className="text-purple-400 font-bold">{skill.sessionsLearning}</span>
                      </div>
                      <div className="w-full bg-gray-700/30 rounded-full h-3 overflow-hidden">
                        <motion.div
                          className="h-full bg-purple-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(skill.sessionsLearning * 20, 100)}%` }}
                          transition={{ duration: 0.8, delay: 0.2 }}
                        />
                      </div>
                    </div>

                    {/* Points */}
                    <div className="text-center mt-4 p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg">
                      <p className="text-green-400 font-bold">{skill.pointsEarned} points earned</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Sessions Timeline Chart */}
        {sessionTimeline.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-2xl p-8 border border-purple-500/20 mb-8"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Sessions Over Time</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sessionTimeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(168, 85, 247, 0.1)" />
                <XAxis dataKey="date" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    borderRadius: '8px'
                  }}
                  cursor={{ fill: 'rgba(168, 85, 247, 0.1)' }}
                />
                <Bar dataKey="sessions" fill="#a855f7" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Points Progress Chart */}
        {pointsTimeline.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-2xl p-8 border border-purple-500/20 mb-8"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Points Progression</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={pointsTimeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(168, 85, 247, 0.1)" />
                <XAxis dataKey="session" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    borderRadius: '8px'
                  }}
                  cursor={{ stroke: 'rgba(168, 85, 247, 0.3)' }}
                />
                <Line
                  type="monotone"
                  dataKey="points"
                  stroke="#ec4899"
                  strokeWidth={3}
                  dot={{ fill: '#ec4899', r: 6 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Skills Distribution Pie Chart */}
        {skillData.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="glass rounded-2xl p-8 border border-purple-500/20"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Skills Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={skillData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ skillName, pointsEarned }) => `${skillName}: ${pointsEarned}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="pointsEarned"
                >
                  {skillData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {skillData.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <TrendingUp className="w-16 h-16 text-gray-600 mx-auto mb-4 opacity-50" />
            <p className="text-gray-400 text-lg">
              No skill data yet. Create or attend sessions to start building your profile!
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export default SkillGraphPage;
