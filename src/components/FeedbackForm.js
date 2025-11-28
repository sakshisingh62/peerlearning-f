/**
 * Feedback Form Component
 * Modal for collecting feedback on sessions
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Star } from 'lucide-react';
import { feedbackDB } from '../db/database';
import { v4 as uuidv4 } from 'uuid';

function FeedbackForm({ session, currentUser, isCreatorForm = false, onClose, onSubmit }) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [learned, setLearned] = useState('');
  const [comment, setComment] = useState('');
  const [behavior, setBehavior] = useState('Good');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!learned.trim()) {
      setError('Please tell us what you learned');
      return;
    }

    setSubmitting(true);

    try {
      const feedbackId = `feedback-${uuidv4()}`;
      const feedbackData = {
        feedbackId,
        sessionId: session.sessionId,
        studentId: currentUser.userId,
        studentName: currentUser.name,
        rating,
        learned,
        comment,
        behavior,
        createdAt: new Date().toISOString()
      };

      await feedbackDB.addFeedback(feedbackData);

      if (onSubmit) {
        onSubmit(feedbackData);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setError('Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 50 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 300, damping: 30 }
    },
    exit: { opacity: 0, scale: 0.8, y: 50 }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      onClick={onClose}
    >
      <motion.div
        className="glass rounded-2xl border border-purple-500/20 w-full max-w-md p-8 relative"
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </motion.button>

        {/* Header */}
        <h2 className="text-2xl font-bold text-white mb-2">
          {isCreatorForm ? 'Complete Session' : 'Share Your Feedback'}
        </h2>
        <p className="text-gray-400 mb-6">
          {isCreatorForm
            ? 'Mark this session as complete and award points'
            : `For: ${session.title}`}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating */}
          <div>
            <label className="block text-white font-semibold mb-3">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <motion.button
                  key={star}
                  type="button"
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className={`transition-all ${
                    star <= (hoverRating || rating)
                      ? 'text-yellow-400'
                      : 'text-gray-600'
                  }`}
                >
                  <Star size={32} fill="currentColor" />
                </motion.button>
              ))}
            </div>
            <p className="text-gray-400 text-sm mt-2">
              {rating === 1 ? 'Poor'
                : rating === 2 ? 'Fair'
                : rating === 3 ? 'Good'
                : rating === 4 ? 'Very Good'
                : 'Excellent'}
            </p>
          </div>

          {/* What you learned */}
          <div>
            <label className="block text-white font-semibold mb-2">
              What did you learn?
            </label>
            <textarea
              value={learned}
              onChange={(e) => {
                setLearned(e.target.value);
                setError('');
              }}
              placeholder="Describe the key concepts or skills you learned..."
              className="w-full glass rounded-lg px-4 py-3 text-white placeholder-gray-500 border border-purple-500/20 outline-none focus:border-purple-500/40 resize-none h-24 transition-all"
            />
          </div>

          {/* Behavior */}
          {!isCreatorForm && (
            <div>
              <label className="block text-white font-semibold mb-3">
                Mentor's Behavior
              </label>
              <div className="space-y-2">
                {['Good', 'Neutral', 'Bad'].map((option) => (
                  <motion.label
                    key={option}
                    whileHover={{ x: 5 }}
                    className="flex items-center gap-3 p-3 glass rounded-lg border border-purple-500/20 cursor-pointer hover:border-purple-500/40 transition-all"
                  >
                    <input
                      type="radio"
                      name="behavior"
                      value={option}
                      checked={behavior === option}
                      onChange={(e) => setBehavior(e.target.value)}
                      className="w-4 h-4 cursor-pointer"
                    />
                    <span className={`font-semibold ${
                      option === 'Good' ? 'text-green-300'
                        : option === 'Neutral' ? 'text-yellow-300'
                        : 'text-red-300'
                    }`}>
                      {option}
                    </span>
                  </motion.label>
                ))}
              </div>
            </div>
          )}

          {/* Additional Comment */}
          <div>
            <label className="block text-white font-semibold mb-2">
              Additional Comments (Optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Any other thoughts or suggestions..."
              className="w-full glass rounded-lg px-4 py-3 text-white placeholder-gray-500 border border-purple-500/20 outline-none focus:border-purple-500/40 resize-none h-20 transition-all"
            />
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-300 text-sm"
            >
              {error}
            </motion.div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="flex-1 bg-gray-500/20 text-gray-300 py-2 rounded-lg font-semibold hover:bg-gray-500/30 transition-all border border-gray-500/30"
            >
              Cancel
            </motion.button>
            <motion.button
              type="submit"
              disabled={submitting}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : isCreatorForm ? 'Complete Session' : 'Submit Feedback'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default FeedbackForm;
