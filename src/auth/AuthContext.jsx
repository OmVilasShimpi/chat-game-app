// src/auth/AuthContext.js
import React, { useContext, useEffect, useState, createContext } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import app from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';


const auth = getAuth(app);
const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);

 useEffect(() => {
  let timeout;

  const updateOnlineStatus = async (user, status) => {
    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, { online: status }, { merge: true });
  };

  const handleVisibilityChange = async () => {
    const user = auth.currentUser;
    if (!user) return;

    if (document.visibilityState === "hidden") {
      // Schedule offline after 30 seconds
      timeout = setTimeout(() => updateOnlineStatus(user, false), 30000);
    } else {
      // Cancel and set online again
      clearTimeout(timeout);
      updateOnlineStatus(user, true);
    }
  };

  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    setCurrentUser(user);
    if (user) {
      await updateOnlineStatus(user, true);
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }
  });

  return () => {
    unsubscribe();
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };
  }, []);


  return (
    <AuthContext.Provider value={{ currentUser }}>
      {children}
    </AuthContext.Provider>
  );
};
