/**
 * Session Card Component
 * Displays session information in card format
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Users, Trophy, Clock } from 'lucide-react';
import { attendeeDB } from '../db/database';

function SessionCard({ session, currentUser }) {
  const [isAttending, setIsAttending] = useState(false);
  const [attendeeCount, setAttendeeCount] = useState(session.attendees?.length || 0);

  useEffect(() => {
    checkAttendance();
  }, [session.sessionId, currentUser]);

  const checkAttendance = async () => {
    if (currentUser) {
      const attending = await attendeeDB.isAttending(session.sessionId, currentUser.userId);
      setIsAttending(attending);
    }
  };

  const getSkillLevelColor = (level) => {
    switch (level) {
      case 'Beginner':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'Intermediate':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'Advanced':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-500/20 text-blue-300';
      case 'ongoing':
        return 'bg-purple-500/20 text-purple-300';
      case 'completed':
        return 'bg-green-500/20 text-green-300';
      default:
        return 'bg-gray-500/20 text-gray-300';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isCreator = currentUser && session && String(currentUser.userId) === String(session.creatorId);
  const isFull = session.maxSeats && attendeeCount >= session.maxSeats;

  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
      className="glass rounded-xl border border-purple-500/20 overflow-hidden hover:border-purple-500/40 transition-all group"
    >
      {/* Card Content */}
      <div className="p-6">
        {/* Header */}
        <div className="mb-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-xl font-bold text-white mb-1 group-hover:text-purple-300 transition-colors">
                {session.title}
              </h3>
              <p className="text-gray-400 text-sm">{session.topic}</p>
            </div>
            {isCreator && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="px-2 py-1 bg-purple-500/30 rounded text-xs font-semibold text-purple-300 border border-purple-500/50"
              >
                Your Session
              </motion.div>
            )}
          </div>

          {/* Status and Level Badges */}
          <div className="flex flex-wrap gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSkillLevelColor(session.skillLevel)}`}>
              {session.skillLevel}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(session.status)}`}>
              {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-300 text-sm mb-4 line-clamp-2">
          {session.description}
        </p>

        {/* Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Calendar size={16} />
            {formatDate(session.dateTime)}
          </div>
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <MapPin size={16} />
            {session.location}
          </div>
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Users size={16} />
            {attendeeCount} {session.maxSeats ? `/ ${session.maxSeats}` : ''} attendees
          </div>
          {session.creatorName && (
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Trophy size={16} />
              Mentor: {session.creatorName}
            </div>
          )}
        </div>

        {/* Capacity Bar */}
        {session.maxSeats && (
          <div className="mb-4">
            <div className="w-full bg-gray-700/30 rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                initial={{ width: 0 }}
                animate={{ width: `${(attendeeCount / session.maxSeats) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}

        {/* Action Button */}
        <Link
          to={`/sessions/${session.sessionId}`}
          className={`w-full py-2 rounded-lg font-semibold text-center transition-all inline-block ${
            isAttending
              ? 'bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30'
              : isFull && !isCreator
              ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-500 to-pink-600 text-white hover:shadow-lg hover:shadow-purple-500/50'
          }`}
        >
          {isAttending ? '✓ Attending' : isFull && !isCreator ? 'Session Full' : 'View Details'}
        </Link>
      </div>
    </motion.div>
  );
}

export default SessionCard;
