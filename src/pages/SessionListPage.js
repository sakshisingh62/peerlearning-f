/**
 * Session List Page
 * Browse all sessions with filtering
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, MapPin, Users, Calendar } from 'lucide-react';
import { sessionDB } from '../db/database';
import SessionCard from '../components/SessionCard';

function SessionListPage({ currentUser }) {
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    skillLevel: '',
    topic: '',
    location: '',
    status: 'scheduled'
  });

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [sessions, filters, searchTerm]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const allSessions = await sessionDB.getAllSessions();
      setSessions(allSessions.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime)));
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = sessions;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(s =>
        s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Skill level filter
    if (filters.skillLevel) {
      filtered = filtered.filter(s => s.skillLevel === filters.skillLevel);
    }

    // Topic filter
    if (filters.topic) {
      filtered = filtered.filter(s => s.topic.toLowerCase().includes(filters.topic.toLowerCase()));
    }

    // Location filter
    if (filters.location) {
      filtered = filtered.filter(s => s.location.toLowerCase().includes(filters.location.toLowerCase()));
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(s => s.status === filters.status);
    }

    setFilteredSessions(filtered);
  };

  const skillLevels = ['Beginner', 'Intermediate', 'Advanced'];
  const statuses = ['scheduled', 'ongoing', 'completed'];

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <motion.section
        className="pt-12 pb-8 px-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-2">Browse Sessions</h1>
          <p className="text-gray-400">
            {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''} available
          </p>
        </div>
      </motion.section>

      {/* Search and Filters */}
      <motion.section
        className="px-4 mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <div className="max-w-6xl mx-auto">
          {/* Search Bar */}
          <div className="glass rounded-lg p-4 mb-6 flex items-center gap-3 border border-purple-500/20">
            <Search className="text-gray-400" />
            <input
              type="text"
              placeholder="Search sessions by title, topic, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none"
            />
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Skill Level Filter */}
            <select
              value={filters.skillLevel}
              onChange={(e) => setFilters({ ...filters, skillLevel: e.target.value })}
              className="glass rounded-lg px-4 py-2 text-white border border-purple-500/20 outline-none cursor-pointer hover:bg-purple-500/10 transition-all"
            >
              <option value="">All Levels</option>
              {skillLevels.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>

            {/* Topic Filter */}
            <input
              type="text"
              placeholder="Filter by topic..."
              value={filters.topic}
              onChange={(e) => setFilters({ ...filters, topic: e.target.value })}
              className="glass rounded-lg px-4 py-2 text-white placeholder-gray-500 border border-purple-500/20 outline-none focus:bg-purple-500/10 transition-all"
            />

            {/* Location Filter */}
            <input
              type="text"
              placeholder="Filter by location..."
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
              className="glass rounded-lg px-4 py-2 text-white placeholder-gray-500 border border-purple-500/20 outline-none focus:bg-purple-500/10 transition-all"
            />

            {/* Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="glass rounded-lg px-4 py-2 text-white border border-purple-500/20 outline-none cursor-pointer hover:bg-purple-500/10 transition-all"
            >
              <option value="">All Status</option>
              {statuses.map(status => (
                <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>
      </motion.section>

      {/* Sessions Grid */}
      <section className="px-4">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-12 h-12 border-4 border-purple-300 border-t-white rounded-full"
              />
            </div>
          ) : filteredSessions.length > 0 ? (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
              layout
            >
              {filteredSessions.map((session, index) => (
                <motion.div
                  key={session.sessionId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  layout
                >
                  <SessionCard session={session} currentUser={currentUser} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              className="text-center py-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Filter className="w-16 h-16 text-gray-600 mx-auto mb-4 opacity-50" />
              <p className="text-gray-400 text-lg">No sessions found</p>
              <p className="text-gray-500 text-sm">Try adjusting your filters</p>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}

export default SessionListPage;
