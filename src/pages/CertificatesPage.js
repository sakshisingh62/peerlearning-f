/**
 * Certificates Page
 * View and manage certificates
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Award } from 'lucide-react';
import { certificateDB } from '../db/database';
import { generateCertificatePDF } from '../utils/pdfGenerator';

function CertificatesPage({ currentUser }) {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCertificates();
  }, [currentUser]);

  const loadCertificates = async () => {
    setLoading(true);
    try {
      if (currentUser) {
        const certs = await certificateDB.getUserCertificates(currentUser.userId);
        setCertificates(certs.sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate)));
      }
    } catch (error) {
      console.error('Error loading certificates:', error);
    }
    setLoading(false);
  };

  const handleDownloadCertificate = async (certificate) => {
    try {
      console.log('Downloading certificate:', certificate);
      
      // Validate certificate data
      if (!certificate.studentName) {
        alert('Error: Student name is missing');
        return;
      }
      if (!certificate.sessionTitle) {
        alert('Error: Session title is missing');
        return;
      }
      
      generateCertificatePDF(certificate);
      alert('Certificate downloaded successfully!');
    } catch (error) {
      console.error('Error downloading certificate:', error);
      alert('Failed to download certificate: ' + error.message);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
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
          <Award className="text-purple-400" size={40} />
          <h1 className="text-4xl font-bold text-white">My Certificates</h1>
        </motion.div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-4 border-purple-300 border-t-white rounded-full"
            />
          </div>
        ) : certificates.length > 0 ? (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {certificates.map((cert, index) => (
              <motion.div
                key={cert.id}
                variants={itemVariants}
                whileHover={{ y: -8 }}
                className="relative group"
              >
                {/* Certificate Card */}
                <div className="glass rounded-2xl p-8 border-2 border-yellow-500/30 h-full flex flex-col justify-between overflow-hidden">
                  {/* Background decoration */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-yellow-400 rounded-full blur-3xl" />
                  </div>

                  {/* Content */}
                  <div className="relative z-10">
                    {/* Certificate Type Icon */}
                    <div className="text-5xl mb-4">
                      {cert.certificateType === 'peer-mentor' ? '👨‍🏫' : '⭐'}
                    </div>

                    {/* Certificate Type */}
                    <p className="text-yellow-400 font-bold uppercase text-sm tracking-wide mb-2">
                      {cert.certificateType === 'peer-mentor'
                        ? 'Peer Mentor Certificate'
                        : 'Outstanding Helper Certificate'}
                    </p>

                    {/* Student Name */}
                    <p className="text-white font-bold text-2xl mb-4">
                      {cert.studentName}
                    </p>

                    {/* Session Title */}
                    <p className="text-gray-300 mb-4 line-clamp-2">
                      <span className="text-gray-400 text-sm">Session:</span><br />
                      {cert.sessionTitle}
                    </p>

                    {/* Issue Date */}
                    <p className="text-gray-400 text-sm mb-6">
                      Issued: {new Date(cert.issueDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>

                    {/* Certificate ID */}
                    <p className="text-gray-500 text-xs font-mono mb-6 truncate">
                      ID: {cert._id}
                    </p>
                  </div>

                  {/* Download Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDownloadCertificate(cert)}
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 mt-6"
                  >
                    <Download size={20} />
                    Download PDF
                  </motion.button>
                </div>

                {/* Gold Border Effect */}
                <div className="absolute inset-0 rounded-2xl border-2 border-yellow-400/0 group-hover:border-yellow-400/30 transition-all pointer-events-none" />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <Award className="w-20 h-20 text-gray-600 mx-auto mb-6 opacity-50" />
            <h2 className="text-2xl font-bold text-white mb-4">No Certificates Yet</h2>
            <p className="text-gray-400 text-lg mb-8">
              Earn certificates by teaching sessions and getting great feedback!
            </p>
            <p className="text-gray-500">
              📋 Certificate types you can earn:
            </p>
            <div className="mt-6 space-y-3 text-left max-w-md mx-auto">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="glass rounded-lg p-4 border border-purple-500/20"
              >
                <p className="text-yellow-400 font-bold mb-1">👨‍🏫 Peer Mentor Certificate</p>
                <p className="text-gray-400 text-sm">Awarded when you complete teaching a session</p>
              </motion.div>
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="glass rounded-lg p-4 border border-purple-500/20"
              >
                <p className="text-yellow-400 font-bold mb-1">⭐ Outstanding Helper Certificate</p>
                <p className="text-gray-400 text-sm">Awarded for exceptional teaching (rating ≥ 4.5)</p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export default CertificatesPage;
