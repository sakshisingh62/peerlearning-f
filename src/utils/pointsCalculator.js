/**
 * Points Calculation System
 * 
 * Formula:
 * - Points based on number of attendees:
 *   * 1 attendee = 2 points
 *   * 2 attendees = 3 points
 *   * 3 attendees = 4 points
 *   * 4 attendees = 5 points
 *   * 5 attendees = 6 points
 *   * 6 attendees = 7 points
 *   * 7 attendees = 8 points
 *   * 8+ attendees = 10 points
 * - +1 point for completing the session
 * - +3 bonus points if average rating >= 4.5
 * - +1 point per "Good" behaviour feedback
 */

export const calculateSessionPoints = (sessionData) => {
  let points = 0;

  // Points based on number of attendees
  const attendeeCount = sessionData.attendees?.length || 0;
  
  if (attendeeCount === 1) {
    points = 2;
  } else if (attendeeCount === 2) {
    points = 3;
  } else if (attendeeCount === 3) {
    points = 4;
  } else if (attendeeCount === 4) {
    points = 5;
  } else if (attendeeCount === 5) {
    points = 6;
  } else if (attendeeCount === 6) {
    points = 7;
  } else if (attendeeCount === 7) {
    points = 8;
  } else if (attendeeCount >= 8) {
    points = 10;
  }

  // +1 for completing session
  if (sessionData.status === 'completed') {
    points += 1;
  }

  return points;
};

export const calculateBonusPoints = (feedbacks) => {
  let bonusPoints = 0;

  if (!feedbacks || feedbacks.length === 0) {
    return bonusPoints;
  }

  // Calculate average rating
  const averageRating = feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length;

  // +3 bonus if average rating >= 4.5
  if (averageRating >= 4.5) {
    bonusPoints += 3;
  }

  // +1 per "Good" behaviour feedback
  const goodBehaviors = feedbacks.filter(f => f.behavior === 'Good').length;
  bonusPoints += goodBehaviors;

  return bonusPoints;
};

export const calculateTotalPoints = (sessionData, feedbacks) => {
  const basePoints = calculateSessionPoints(sessionData);
  const bonusPoints = calculateBonusPoints(feedbacks);
  return basePoints + bonusPoints;
};

/**
 * Feedback Analysis
 */
export const calculateAverageFeedback = (feedbacks) => {
  if (!feedbacks || feedbacks.length === 0) {
    return {
      averageRating: 0,
      totalFeedback: 0,
      goodCount: 0,
      neutralCount: 0,
      badCount: 0
    };
  }

  const averageRating = feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length;
  const goodCount = feedbacks.filter(f => f.behavior === 'Good').length;
  const neutralCount = feedbacks.filter(f => f.behavior === 'Neutral').length;
  const badCount = feedbacks.filter(f => f.behavior === 'Bad').length;

  return {
    averageRating: parseFloat(averageRating.toFixed(2)),
    totalFeedback: feedbacks.length,
    goodCount,
    neutralCount,
    badCount
  };
};

/**
 * Badge Awards Logic
 */
export const shouldAwardBadge = (userPoints, userBadges = []) => {
  const badgeThresholds = [
    { name: '⭐ Beginner Helper', points: 5 },
    { name: '🎓 Peer Mentor', points: 20 },
    { name: '🔥 Super Helper', points: 50 },
    { name: '🏆 Champion Mentor', points: 100 }
  ];

  const awardedBadges = [];

  for (const badge of badgeThresholds) {
    if (userPoints >= badge.points && !userBadges.some(b => b.name === badge.name)) {
      awardedBadges.push(badge.name);
    }
  }

  return awardedBadges;
};

/**
 * Certificate Eligibility
 */
export const checkCertificateEligibility = (sessionData, feedbacks) => {
  const feedback = calculateAverageFeedback(feedbacks);
  const eligibility = {
    peerMentor: sessionData.status === 'completed' && sessionData.attendees?.length > 0,
    outstandingHelper: feedback.averageRating >= 4.5 && feedback.goodCount > feedback.badCount
  };

  return eligibility;
};

export default {
  calculateSessionPoints,
  calculateBonusPoints,
  calculateTotalPoints,
  calculateAverageFeedback,
  shouldAwardBadge,
  checkCertificateEligibility
};
