import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import bombAnimation from '../assets/Bomb Animation.json'; // ✅ Make sure path is correct

export default function Home() {
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i = 1) => ({
      opacity: 1,
      y: 0,
      transition: { delay: 0.2 * i, duration: 0.6 }
    }),
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2rem',
        background: 'linear-gradient(to bottom right, #eef2f3, #8e9eab)',
        overflow: 'hidden',
      }}
    >
      {/* 💣 Lottie Animation on the left */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1 }}
        style={{ width: '320px', marginRight: '2rem' }}
      >
        <Lottie animationData={bombAnimation} loop={true} />
      </motion.div>

      {/* 📋 Main content */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.2 } } }}
        style={{
          color: '#333',
          maxWidth: '600px',
          textAlign: 'center',
        }}
      >
        <motion.h1
          variants={fadeInUp}
          style={{ fontSize: '3rem', marginBottom: '1rem' }}
        >
          💬 Chat, 🎮 Game, 👥 Connect
        </motion.h1>

        <motion.p
          variants={fadeInUp}
          style={{ fontSize: '1.25rem', marginBottom: '2rem' }}
        >
          A social platform to chat with friends, play live games, and build your circle.
        </motion.p>

        <motion.div
          style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}
          variants={fadeInUp}
        >
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            style={{
              padding: '10px 20px',
              fontSize: '1rem',
              border: 'none',
              borderRadius: '6px',
              background: '#333',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            <Link to="/app" style={{ color: 'white', textDecoration: 'none' }}>
              Login
            </Link>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            style={{
              padding: '10px 20px',
              fontSize: '1rem',
              borderRadius: '6px',
              background: 'white',
              border: '1px solid #333',
              cursor: 'pointer',
              color: '#333',
            }}
          >
            <Link to="/app" style={{ color: '#333', textDecoration: 'none' }}>
              Sign Up
            </Link>
          </motion.button>
        </motion.div>

        <motion.div
          style={{ marginTop: '3rem', textAlign: 'left' }}
          variants={fadeInUp}
        >
          <h3 style={{ marginBottom: '1rem' }}>✨ Features:</h3>
          <ul style={{ lineHeight: '2', listStyle: 'none', paddingLeft: '1rem' }}>
            <motion.li variants={fadeInUp}>💬 Real-time chat with seen indicators</motion.li>
            <motion.li variants={fadeInUp}>🎮 Play Tic Tac Toe with friends</motion.li>
            <motion.li variants={fadeInUp}>👥 Add friends and build group chats</motion.li>
            <motion.li variants={fadeInUp}>🔐 Secure login with Email & Google</motion.li>
          </ul>
        </motion.div>
      </motion.div>
    </div>
  );
}
