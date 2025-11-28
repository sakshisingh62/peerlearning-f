/**
 * Session Detail Page
 * Full session information with join, feedback, and completion options
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Calendar, MapPin, Users, Trophy, Download, CheckCircle } from 'lucide-react';
import {
  sessionDB,
  attendeeDB,
  feedbackDB,
  pointsDB,
  certificateDB,
  badgeDB,
  userDB
} from '../db/database';
import {
  calculateSessionPoints,
  calculateBonusPoints,
  calculateTotalPoints,
  calculateAverageFeedback,
  checkCertificateEligibility
} from '../utils/pointsCalculator';
import { generateSessionPDF } from '../utils/pdfGenerator';
import FeedbackForm from '../components/FeedbackForm';

function SessionDetailPage({ currentUser }) {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAttending, setIsAttending] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [sessionStats, setSessionStats] = useState(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    loadSessionData();
  }, [sessionId]);

  const loadSessionData = async () => {
    setLoading(true);
    try {
      const sessionData = await sessionDB.getSession(sessionId);
      setSession(sessionData);

      // If creatorName is missing, fetch the creator's name
      if (sessionData && !sessionData.creatorName && sessionData.creatorId) {
        try {
          const creator = await userDB.getUser(sessionData.creatorId);
          if (creator && creator.name) {
            sessionData.creatorName = creator.name;
            setSession({ ...sessionData });
          }
        } catch (error) {
          console.warn('Failed to fetch creator name:', error);
        }
      }

      const attendeeList = await attendeeDB.getAttendees(sessionId);
      
      // Fetch attendee names for each user ID
      const attendeesWithNames = [];
      for (const attendee of attendeeList) {
        try {
          const userId = attendee.userId || attendee.studentId || attendee;
          if (userId) {
            const user = await userDB.getUser(userId);
            attendeesWithNames.push({
              userId: userId,
              name: user?.name || user?.studentName || `User ${userId}`,
              joinedAt: attendee.joinedAt || attendee.createdAt
            });
          }
        } catch (error) {
          console.warn(`Failed to fetch name for user ${attendee}:`, error);
          // Fallback: add attendee without name resolution
          const userId = attendee.userId || attendee.studentId || attendee;
          attendeesWithNames.push({
            userId: userId,
            name: `User ${userId}`,
            joinedAt: attendee.joinedAt || attendee.createdAt
          });
        }
      }
      
      setAttendees(attendeesWithNames);

      const feedbackList = await feedbackDB.getFeedbackForSession(sessionId);
      setFeedbacks(feedbackList);

      if (currentUser && sessionData) {
        const attending = await attendeeDB.isAttending(sessionId, currentUser.userId);
        setIsAttending(attending);
      }

      if (sessionData && feedbackList.length > 0) {
        calculateStats(sessionData, feedbackList);
      }
    } catch (error) {
      console.error('Error loading session:', error);
    }
    setLoading(false);
  };

  const calculateStats = (sessionData, feedbackList) => {
    const basePoints = calculateSessionPoints(sessionData);
    const bonusPoints = calculateBonusPoints(feedbackList);
    const totalPoints = basePoints + bonusPoints;
    const feedback = calculateAverageFeedback(feedbackList);

    setSessionStats({
      basePoints,
      bonusPoints,
      totalPoints,
      feedback
    });
  };

  const handleJoinSession = async () => {
    if (!currentUser || !currentUser.userId) {
      alert('You must be logged in to join a session');
      return;
    }

    setJoining(true);
    try {
      const result = await attendeeDB.addAttendee(sessionId, currentUser.userId);

      // sessionAPI returns the updated session object on success
      if (result && result.attendees) {
        setIsAttending(true);
        await loadSessionData();
        alert('Successfully joined the session!');
      } else if (result && result.message) {
        alert(result.message);
      } else {
        alert('Joined (response unknown)');
      }
    } catch (error) {
      // Try to surface backend message if present
      const msg = error?.response?.data?.message || error?.message || String(error);
      console.error('Error joining session:', error);
      alert(`Failed to join session: ${msg}`);
    } finally {
      setJoining(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      await generateSessionPDF(session, feedbacks, session.creatorName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF');
    }
  };

  const handleCompleteSession = async (createdFeedback) => {
    try {
      // Mark session as completed
      await sessionDB.completeSession(sessionId);

      // Calculate and award points to creator
      const sessionData = await sessionDB.getSession(sessionId);
      const allFeedbacks = [...feedbacks, createdFeedback];
      
      const basePoints = calculateSessionPoints(sessionData);
      const bonusPoints = calculateBonusPoints(allFeedbacks);
      const totalPoints = basePoints + bonusPoints;

      // Add points
      await pointsDB.addPoints(
        session.creatorId,
        totalPoints,
        `Session: ${session.title}`
      );

      // Check and award certificates
      const eligibility = checkCertificateEligibility(sessionData, allFeedbacks);
      if (eligibility.peerMentor) {
        await certificateDB.createCertificate({
          certificateId: `cert-${session.creatorId}-${Date.now()}`,
          userId: session.creatorId,
          studentName: session.creatorName,
          sessionId: sessionId,
          sessionTitle: session.title,
          certificateType: avgRating >= 4.5 ? 'outstanding-helper' : 'peer-mentor',
          averageRating: avgRating,
          totalAttendees: attendees.length
        });
      }

      // Award badges
      const avgRating = allFeedbacks.length > 0
        ? allFeedbacks.reduce((sum, f) => sum + f.rating, 0) / allFeedbacks.length
        : 0;

      if (avgRating >= 4.5) {
        try {
          await badgeDB.addBadge({
            badgeId: `badge-${session.creatorId}-${Date.now()}`,
            userId: session.creatorId,
            badgeName: '⭐ Excellent Teacher',
            badgeType: 'excellent-teacher',
            description: 'Awarded for receiving excellent ratings (≥4.5)'
          });
        } catch (error) {
          console.warn('Badge may already exist:', error);
        }
      } else if (avgRating >= 4.0) {
        try {
          await badgeDB.addBadge({
            badgeId: `badge-${session.creatorId}-${Date.now()}`,
            userId: session.creatorId,
            badgeName: '🎓 Peer Mentor',
            badgeType: 'peer-mentor',
            description: 'Awarded for teaching your first session'
          });
        } catch (error) {
          console.warn('Badge may already exist:', error);
        }
      }

      setShowCompleteForm(false);
      loadSessionData();
      alert('Session completed! Points and certificates awarded.');
    } catch (error) {
      console.error('Error completing session:', error);
      alert('Failed to complete session');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-purple-300 border-t-white rounded-full"
        />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Session not found</h1>
          <button
            onClick={() => navigate('/sessions')}
            className="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 transition-all"
          >
            Back to Sessions
          </button>
        </div>
      </div>
    );
  }

  const isCreator = currentUser && session && String(currentUser.userId) === String(session.creatorId);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pb-12"
    >
      <div className="max-w-4xl mx-auto px-4 pt-8">
        {/* Back Button */}
        <motion.button
          whileHover={{ x: -5 }}
          onClick={() => navigate('/sessions')}
          className="flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-8 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Sessions
        </motion.button>

        {/* Session Header */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-8 border border-purple-500/20 mb-8"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">{session.title}</h1>
              <p className="text-xl text-purple-300">{session.topic}</p>
            </div>
            {isCreator && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="px-4 py-2 bg-purple-500/30 rounded-lg text-purple-300 font-semibold border border-purple-500/50"
              >
                Your Session
              </motion.div>
            )}
          </div>

          {/* Status and Level */}
          <div className="flex flex-wrap gap-3 mb-6">
            <span className="px-4 py-2 bg-yellow-500/20 text-yellow-300 rounded-full text-sm font-semibold">
              {session.skillLevel} Level
            </span>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
              session.status === 'scheduled' ? 'bg-blue-500/20 text-blue-300' :
              session.status === 'ongoing' ? 'bg-purple-500/20 text-purple-300' :
              'bg-green-500/20 text-green-300'
            }`}>
              {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
            </span>
          </div>

          {/* Description */}
          <p className="text-gray-300 text-lg mb-8 leading-relaxed">
            {session.description}
          </p>

          {/* Session Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-4 p-4 glass rounded-lg border border-purple-500/20"
            >
              <Calendar className="text-purple-400" size={24} />
              <div>
                <p className="text-gray-400 text-sm">Date & Time</p>
                <p className="text-white font-semibold">
                  {new Date(session.dateTime).toLocaleString()}
                </p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-4 p-4 glass rounded-lg border border-purple-500/20"
            >
              <MapPin className="text-pink-400" size={24} />
              <div>
                <p className="text-gray-400 text-sm">Location</p>
                <p className="text-white font-semibold">{session.location}</p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-4 p-4 glass rounded-lg border border-purple-500/20"
            >
              <Users className="text-blue-400" size={24} />
              <div>
                <p className="text-gray-400 text-sm">Attendees</p>
                <p className="text-white font-semibold">
                  {attendees.length} {session.maxSeats ? `/ ${session.maxSeats}` : ''} joined
                </p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-4 p-4 glass rounded-lg border border-purple-500/20"
            >
              <Trophy className="text-yellow-400" size={24} />
              <div>
                <p className="text-gray-400 text-sm">Mentor</p>
                <p className="text-white font-semibold">{session.creatorName || 'Unknown'}</p>
              </div>
            </motion.div>
          </div>

          {/* Prerequisites */}
          {session.prerequisites && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-8 p-4 glass rounded-lg border border-blue-500/20 bg-blue-500/5"
            >
              <p className="text-blue-300 font-semibold mb-2">📋 Prerequisites:</p>
              <p className="text-gray-300">{session.prerequisites}</p>
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 mb-8">
            {!isAttending && !isCreator && session.status === 'scheduled' && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleJoinSession}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                Join Session
              </motion.button>
            )}

            {isAttending && (
              <motion.button
                disabled
                className="flex-1 bg-green-500/20 text-green-300 py-3 rounded-lg font-semibold border border-green-500/30 flex items-center justify-center gap-2"
              >
                <CheckCircle size={20} />
                You're Attending
              </motion.button>
            )}

            {isCreator && session.status === 'completed' && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleDownloadPDF}
                className="flex-1 bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
              >
                <Download size={20} />
                Download PDF Report
              </motion.button>
            )}

            {isCreator && session.status !== 'completed' && feedbacks.length > 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCompleteForm(true)}
                className="flex-1 bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-all"
              >
                Complete Session & Award Points
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Feedback Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-8 border border-purple-500/20 mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Feedback</h2>

          {/* Statistics */}
          {sessionStats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <motion.div
                whileHover={{ y: -5 }}
                className="glass rounded-lg p-4 border border-purple-500/20 text-center"
              >
                <p className="text-gray-400 text-sm mb-2">Average Rating</p>
                <p className="text-3xl font-bold text-yellow-400">
                  {sessionStats.feedback.averageRating.toFixed(1)}/5
                </p>
              </motion.div>
              <motion.div
                whileHover={{ y: -5 }}
                className="glass rounded-lg p-4 border border-purple-500/20 text-center"
              >
                <p className="text-gray-400 text-sm mb-2">Total Feedbacks</p>
                <p className="text-3xl font-bold text-blue-400">
                  {sessionStats.feedback.totalFeedback}
                </p>
              </motion.div>
              <motion.div
                whileHover={{ y: -5 }}
                className="glass rounded-lg p-4 border border-purple-500/20 text-center"
              >
                <p className="text-gray-400 text-sm mb-2">Base Points</p>
                <p className="text-3xl font-bold text-purple-400">
                  +{sessionStats.basePoints}
                </p>
              </motion.div>
              <motion.div
                whileHover={{ y: -5 }}
                className="glass rounded-lg p-4 border border-purple-500/20 text-center"
              >
                <p className="text-gray-400 text-sm mb-2">Bonus Points</p>
                <p className="text-3xl font-bold text-green-400">
                  +{sessionStats.bonusPoints}
                </p>
              </motion.div>
            </div>
          )}

          {/* Give Feedback Button */}
          {currentUser && isAttending && !feedbacks.some(f => f.studentId === currentUser.userId) && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFeedbackForm(true)}
              className="w-full mb-8 bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              Give Feedback
            </motion.button>
          )}

          {/* Feedbacks List */}
          <div className="space-y-4">
            {feedbacks.length > 0 ? (
              feedbacks.map((feedback, index) => (
                <motion.div
                  key={feedback.feedbackId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass rounded-lg p-4 border border-purple-500/20 hover:border-purple-500/40 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-white">{feedback.studentName}</p>
                      <p className="text-gray-400 text-sm">⭐ {feedback.rating}/5 • {feedback.behavior}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      feedback.behavior === 'Good' ? 'bg-green-500/20 text-green-300' :
                      feedback.behavior === 'Neutral' ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-red-500/20 text-red-300'
                    }`}>
                      {feedback.behavior}
                    </span>
                  </div>
                  <p className="text-gray-300 mb-2">
                    <span className="font-semibold text-purple-300">Learned:</span> {feedback.learned}
                  </p>
                  {feedback.comment && (
                    <p className="text-gray-400 text-sm italic">"{feedback.comment}"</p>
                  )}
                </motion.div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-8">No feedback yet</p>
            )}
          </div>
        </motion.div>

        {/* Attendees Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-8 border border-purple-500/20"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Attendees ({attendees.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {attendees.map((attendee, index) => (
              <motion.div
                key={`${attendee.userId}-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 p-3 glass rounded-lg border border-purple-500/20"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center text-white font-bold">
                  {attendee.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-white">
                    {attendee.name}
                  </p>
                  {attendee.joinedAt && (
                    <p className="text-gray-400 text-xs">Joined {new Date(attendee.joinedAt).toLocaleDateString()}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showFeedbackForm && (
          <FeedbackForm
            session={session}
            currentUser={currentUser}
            onClose={() => setShowFeedbackForm(false)}
            onSubmit={(feedback) => {
              loadSessionData();
              setShowFeedbackForm(false);
            }}
          />
        )}

        {showCompleteForm && (
          <FeedbackForm
            session={session}
            currentUser={currentUser}
            isCreatorForm={true}
            onClose={() => setShowCompleteForm(false)}
            onSubmit={handleCompleteSession}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default SessionDetailPage;
