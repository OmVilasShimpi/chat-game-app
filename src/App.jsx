import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';

import Home from './components/Home';
import MainApp from './components/MainApp'; // you’ll create this file now

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/app" element={<MainApp />} />
      </Routes>
    </AuthProvider>
  );
}
