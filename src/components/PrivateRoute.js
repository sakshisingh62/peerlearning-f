/**
 * PrivateRoute Component
 * Redirects to login if user is not authenticated
 */

import React from 'react';
import { Navigate } from 'react-router-dom';

function PrivateRoute({ children, currentUser }) {
  // If no user is logged in, redirect to login page
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // If user is logged in, show the protected content
  return children;
}

export default PrivateRoute;
