// src/App.jsx
import React, { useState } from 'react';
import SignUp from './auth/SignUp';
import Login from './auth/Login';
import GoogleLoginButton from './auth/GoogleLoginButton';
import { AuthProvider } from './auth/AuthContext';
import { getAuth } from "firebase/auth";
import { doc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import UserList from './components/UserList';
import ChatWindow from './components/ChatWindow';
import { useAuth } from './auth/AuthContext';

function UserInfo({ onLogout }) {
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
      onLogout(); // Clear selected user when logging out
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

function MainApp() {
  const [selectedUser, setSelectedUser] = useState(null);
  const { currentUser } = useAuth();

  const handleLogout = () => {
    setSelectedUser(null); // Clear chat on logout
  };

  return (
    <div>
      <h1>Firebase Auth + Profile</h1>
      <SignUp />
      <Login />
      <GoogleLoginButton />
      <UserInfo onLogout={handleLogout} />
      {currentUser && (
        <>
          <UserList onUserSelect={(user) => setSelectedUser(user)} />
          {selectedUser && <ChatWindow selectedUser={selectedUser} />}
        </>
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
