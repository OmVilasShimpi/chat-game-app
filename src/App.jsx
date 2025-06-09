// src/App.jsx
import React from 'react';
import SignUp from './auth/SignUp';
import Login from './auth/Login';
import GoogleLoginButton from './auth/GoogleLoginButton';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { getAuth } from "firebase/auth";
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';


function UserInfo() {
  const { currentUser } = useAuth();

  const handleLogout = async () => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (user) {
    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, { online: false }, { merge: true });
  }

  try {
    await auth.signOut();
    alert("Logged out successfully!");
  } catch (error) {
    alert("Logout failed: " + error.message);
  }
};

  return currentUser ? (
    <div>
      <p>Logged in as: {currentUser.email}</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  ) : (
    <p>Not logged in</p>
  );
}

function App() {
  return (
    <AuthProvider>
      <div>
        <h1>Firebase Auth + Profile</h1>
        <SignUp />
        <Login />
        <GoogleLoginButton />
        <UserInfo />
      </div>
    </AuthProvider>
  );
}

export default App;
