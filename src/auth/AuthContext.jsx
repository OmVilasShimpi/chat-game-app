// src/auth/AuthContext.js
import React, { useContext, useEffect, useState, createContext } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import app from '../firebase';

const auth = getAuth(app);
const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => setCurrentUser(user));
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser }}>
      {children}
    </AuthContext.Provider>
  );
};
