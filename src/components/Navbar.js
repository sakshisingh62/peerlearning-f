/**
 * Navbar Component
 * Navigation and user indicator
 */

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Menu, X, LogIn, UserPlus, LogOut } from 'lucide-react';

function Navbar({ currentUser, isOnline, onLogout }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const links = [
    { label: 'Home', path: '/' },
    { label: 'Sessions', path: '/sessions' },
    { label: 'Create', path: '/create-session' },
    { label: 'Leaderboard', path: '/leaderboard' },
    { label: 'Skills', path: '/skills' },
    { label: 'Certificates', path: '/certificates' },
    { label: 'Profile', path: '/profile' }
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    localStorage.removeItem('userId');
    onLogout();
    navigate('/login');
  };

  const isGuestUser =
    currentUser?.name?.startsWith('Guest') ||
    currentUser?.name?.startsWith('Student');

  const isGoogleUser = currentUser?.authProvider === 'google';

  // ✅ FIX: Ensure Google photos always include a valid size token
  const getGooglePhoto = (url) => {
    if (!url) return '';
    if (!url.startsWith('https://lh3.googleusercontent.com')) return url;
    return url.includes('=') ? url : `${url}=s96-c`;
  };

  return (
    <nav className="sticky top-0 z-40 glass-dark shadow-2xl border-b border-purple-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-600 rounded-lg flex items-center justify-center text-white font-bold group-hover:shadow-lg transition-all">
              📚
            </div>
            <span className="hidden sm:inline text-xl font-bold gradient-text">
              NavPeer
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="relative px-3 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                {isActive(link.path) && (
                  <motion.div
                    layoutId="navbar-indicator"
                    className="absolute inset-0 bg-purple-500/20 rounded-lg"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{link.label}</span>
              </Link>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Online Status */}
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ scale: isOnline ? [1, 1.2, 1] : 1 }}
                transition={{ duration: 2, repeat: Infinity }}
                className={`w-3 h-3 rounded-full ${
                  isOnline ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              <span className="hidden sm:inline text-xs text-gray-400">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* Auth Buttons or User Avatar */}
            {currentUser ? (
              <div className="flex items-center gap-2">
                {/* User Avatar */}
                <Link
                  to="/profile"
                  className="w-10 h-10 rounded-full overflow-hidden border-2 border-purple-400 hover:border-pink-400 transition-all cursor-pointer hover:shadow-lg"
                >
                  <img
                    src={
                      isGoogleUser
                        ? getGooglePhoto(
                            currentUser?.profilePicture ||
                              currentUser?.photoURL
                          )
                        : currentUser?.profilePicture ||
                          currentUser?.photoURL ||
                          `https://i.pravatar.cc/150?u=${currentUser?.userId}`
                    }
                    alt={currentUser.name}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      if (isGoogleUser) {
                        e.currentTarget.src =
                          'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150"><rect width="100%" height="100%" fill="%23374151"/><text x="50%" y="50%" fill="%239CA3AF" font-size="36" text-anchor="middle" dominant-baseline="middle">?</text></svg>';
                      } else {
                        e.currentTarget.src = `https://i.pravatar.cc/150?u=${currentUser?.userId}`;
                      }
                    }}
                    className="w-full h-full object-cover"
                  />
                </Link>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white transition-colors"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                {/* Login Button */}
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                >
                  <LogIn size={18} />
                  Login
                </Link>

                {/* Sign Up Button */}
                <Link
                  to="/signup"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all"
                >
                  <UserPlus size={18} />
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-white hover:text-purple-400 transition-colors"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden mt-4 space-y-2"
          >
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg transition-all ${
                  isActive(link.path)
                    ? 'bg-purple-500/20 text-white'
                    : 'text-gray-300 hover:bg-purple-500/10 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Mobile Auth Buttons */}
            {!currentUser && (
              <div className="pt-2 mt-2 border-t border-gray-700 space-y-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-300 hover:bg-purple-500/10 hover:text-white transition-all"
                >
                  <LogIn size={18} />
                  Login
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-600 text-white"
                >
                  <UserPlus size={18} />
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Logout */}
            {currentUser && (
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-gray-300 hover:bg-red-500/10 hover:text-red-400 transition-all"
              >
                <LogOut size={18} />
                Logout
              </button>
            )}
          </motion.div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
