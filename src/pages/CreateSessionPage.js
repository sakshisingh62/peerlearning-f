/**
 * Create Session Page
 * Form to create new peer learning sessions
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { sessionAPI } from '../services/api';

function CreateSessionPage({ currentUser }) {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    topic: '',
    description: '',
    skillLevel: 'Beginner',
    location: '',
    dateTime: '',
    maxSeats: '',
    prerequisites: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('CreateSessionPage: useEffect - currentUser:', currentUser);
    // Redirect to login if no user
    if (!currentUser) {
      console.log('CreateSessionPage: No user found, redirecting to login');
      navigate('/login');
    }
  }, [currentUser, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    console.log('=== SESSION CREATION STARTED ===');
    console.log('Current User:', currentUser);
    console.log('Form Data:', formData);

    // Validation
    if (!formData.title.trim()) {
      setError('Session title is required');
      return;
    }
    if (!formData.topic.trim()) {
      setError('Topic is required');
      return;
    }
    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }
    if (!formData.location.trim()) {
      setError('Location is required');
      return;
    }
    if (!formData.dateTime) {
      setError('Date and time are required');
      return;
    }

    setSubmitting(true);

    try {
      // Check if currentUser exists
      if (!currentUser) {
        console.error('ERROR: No currentUser found');
        throw new Error('You must be logged in to create a session. Please login first.');
      }
      
      if (!currentUser.userId) {
        console.error('ERROR: currentUser has no userId:', currentUser);
        throw new Error('Invalid user session. Please logout and login again.');
      }

      console.log('User validation passed. Creating session...');

      // Generate unique session ID
      const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const sessionData = {
        sessionId,
        title: formData.title.trim(),
        topic: formData.topic.trim(),
        description: formData.description.trim(),
        skillLevel: formData.skillLevel,
        location: formData.location.trim(),
        dateTime: formData.dateTime,
        maxSeats: formData.maxSeats ? parseInt(formData.maxSeats) : null,
        prerequisites: formData.prerequisites.trim(),
        creatorId: currentUser.userId,
        creatorName: currentUser.name || 'Unknown',
        attendees: [],
        status: 'scheduled'
      };

      console.log('Session data prepared:', sessionData);
      console.log('Calling sessionAPI.createSession...');
      
      const result = await sessionAPI.createSession(sessionData);
      
      console.log('Session created successfully! Result:', result);
      console.log('=== SESSION CREATION COMPLETED ===');

      alert('Session created successfully!');
      navigate('/sessions');
    } catch (error) {
      console.error('=== SESSION CREATION FAILED ===');
      console.error('Error type:', error.constructor.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      console.error('Full error:', error);
      setError(`Failed to create session: ${error.message || 'Unknown error. Check console for details.'}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pb-12"
    >
      <div className="max-w-2xl mx-auto px-4 pt-8">
        {/* Back Button */}
        <motion.button
          whileHover={{ x: -5 }}
          onClick={() => navigate('/sessions')}
          className="flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-8 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Sessions
        </motion.button>

        {/* Header */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">Create New Session</h1>
          <p className="text-gray-400">
            Share your knowledge and help others learn. Sessions are saved offline instantly.
          </p>
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit}
          className="glass rounded-2xl p-8 border border-purple-500/20 space-y-6"
        >
          {/* Title */}
          <div>
            <label className="block text-white font-semibold mb-2">
              Session Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Introduction to JavaScript Basics"
              className="w-full glass rounded-lg px-4 py-3 text-white placeholder-gray-500 border border-purple-500/20 outline-none focus:border-purple-500/40 transition-all"
            />
            <p className="text-gray-400 text-xs mt-1">
              Make it clear and descriptive
            </p>
          </div>

          {/* Topic */}
          <div>
            <label className="block text-white font-semibold mb-2">
              Topic *
            </label>
            <input
              type="text"
              name="topic"
              value={formData.topic}
              onChange={handleChange}
              placeholder="e.g., JavaScript, Web Development, Python"
              className="w-full glass rounded-lg px-4 py-3 text-white placeholder-gray-500 border border-purple-500/20 outline-none focus:border-purple-500/40 transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-white font-semibold mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe what will be covered in this session..."
              className="w-full glass rounded-lg px-4 py-3 text-white placeholder-gray-500 border border-purple-500/20 outline-none focus:border-purple-500/40 resize-none h-24 transition-all"
            />
          </div>

          {/* Skill Level and Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-white font-semibold mb-2">
                Skill Level *
              </label>
              <select
                name="skillLevel"
                value={formData.skillLevel}
                onChange={handleChange}
                className="w-full glass rounded-lg px-4 py-3 text-white border border-purple-500/20 outline-none cursor-pointer focus:border-purple-500/40 transition-all"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-white font-semibold mb-2">
                Location *
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., Classroom 3, Lab, Online"
                className="w-full glass rounded-lg px-4 py-3 text-white placeholder-gray-500 border border-purple-500/20 outline-none focus:border-purple-500/40 transition-all"
              />
            </div>
          </div>

          {/* Date and Time */}
          <div>
            <label className="block text-white font-semibold mb-2">
              Date & Time *
            </label>
            <input
              type="datetime-local"
              name="dateTime"
              value={formData.dateTime}
              onChange={handleChange}
              className="w-full glass rounded-lg px-4 py-3 text-white border border-purple-500/20 outline-none focus:border-purple-500/40 transition-all"
            />
          </div>

          {/* Max Seats */}
          <div>
            <label className="block text-white font-semibold mb-2">
              Maximum Seats (Optional)
            </label>
            <input
              type="number"
              name="maxSeats"
              value={formData.maxSeats}
              onChange={handleChange}
              placeholder="Leave blank for unlimited"
              min="1"
              className="w-full glass rounded-lg px-4 py-3 text-white placeholder-gray-500 border border-purple-500/20 outline-none focus:border-purple-500/40 transition-all"
            />
          </div>

          {/* Prerequisites */}
          <div>
            <label className="block text-white font-semibold mb-2">
              Prerequisites (Optional)
            </label>
            <textarea
              name="prerequisites"
              value={formData.prerequisites}
              onChange={handleChange}
              placeholder="e.g., Know basic HTML, familiarity with Git, etc."
              className="w-full glass rounded-lg px-4 py-3 text-white placeholder-gray-500 border border-purple-500/20 outline-none focus:border-purple-500/40 resize-none h-20 transition-all"
            />
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 text-red-300"
            >
              {error}
            </motion.div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3 pt-6">
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/sessions')}
              className="flex-1 bg-gray-500/20 text-gray-300 py-3 rounded-lg font-semibold hover:bg-gray-500/30 transition-all border border-gray-500/30"
            >
              Cancel
            </motion.button>
            <motion.button
              type="submit"
              disabled={submitting}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Session'}
            </motion.button>
          </div>

          <p className="text-gray-400 text-xs text-center">
            💾 All data is saved locally to your device
          </p>
        </motion.form>
      </div>
    </motion.div>
  );
}

export default CreateSessionPage;
