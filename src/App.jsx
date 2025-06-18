// src/App.jsx
import React, { useEffect, useState } from 'react';
import SignUp from './auth/SignUp';
import Login from './auth/Login';
import GoogleLoginButton from './auth/GoogleLoginButton';
import { AuthProvider } from './auth/AuthContext';
import { getAuth } from "firebase/auth";
import { doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import UserList from './components/UserList';
import ChatWindow from './components/ChatWindow';
import FriendRequest from './components/FriendRequest';
import FriendRequestsInbox from './components/FriendRequestsInbox';
import FriendList from './components/FriendList';
import GameInvitation from './components/GameInvitation';
import TicTacToe from './components/TicTacToe';
import GameInvitePopup from './components/GameInvitePopup';
import useOutgoingGameWatch from './hooks/useOutgoingGameWatch';
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
      onLogout();
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
  const [friendsMap, setFriendsMap] = useState({});
  const [activeGameId, setActiveGameId] = useState(null);
  const { currentUser } = useAuth();

  const handleLogout = () => {
    setSelectedUser(null);
    setActiveGameId(null);
  };

  // Load friends
  useEffect(() => {
    if (!currentUser) return;

    const friendRef = doc(db, 'friends', currentUser.uid);
    const unsubscribe = onSnapshot(friendRef, (snap) => {
      if (snap.exists()) {
        setFriendsMap(snap.data());
      } else {
        setFriendsMap({});
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Mark user as online
  useEffect(() => {
    if (!currentUser) return;

    const markOnline = async () => {
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, { online: true }, { merge: true });
    };

    markOnline();
  }, [currentUser]);

  // Validate access to the active game
  useEffect(() => {
    const checkGameAccess = async () => {
      if (!currentUser || !activeGameId) return;

      const gameRef = doc(db, 'games', activeGameId);
      const snap = await getDoc(gameRef);
      if (!snap.exists()) return setActiveGameId(null);

      const game = snap.data();
      if (!game.players.includes(currentUser.uid)) {
        setActiveGameId(null);
      }
    };

    checkGameAccess();
  }, [activeGameId, currentUser]);

  // Watch for game creation after sending invite
  useOutgoingGameWatch(currentUser, setActiveGameId);

  const handleUserSelect = (user) => {
    if (friendsMap[user.uid]) {
      setSelectedUser(user);
    } else {
      alert("You can only chat with your friends.");
    }
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
          <UserList onUserSelect={handleUserSelect} />
          {selectedUser && <ChatWindow selectedUser={selectedUser} />}
          <FriendRequest />
          <FriendRequestsInbox />
          <FriendList />
          <GameInvitation onGameCreated={setActiveGameId} />
          <GameInvitePopup onGameAccepted={setActiveGameId} />
          {activeGameId && (
            <TicTacToe gameId={activeGameId} onExit={() => setActiveGameId(null)} />
          )}
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
