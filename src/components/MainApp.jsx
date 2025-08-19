import React, { useEffect, useState } from 'react';
import SignUp from '../auth/SignUp';
import Login from '../auth/Login';
import GoogleLoginButton from '../auth/GoogleLoginButton';
import { getAuth } from 'firebase/auth';
import {
  doc,
  setDoc,
  onSnapshot,
  getDoc,
  collection,
  query,
  where
} from 'firebase/firestore';
import { db } from '../firebase';
import UserList from './UserList';
import ChatWindow from './ChatWindow';
import FriendRequest from './FriendRequest';
import FriendRequestsInbox from './FriendRequestsInbox';
import FriendList from './FriendList';
import GameInvitation from './GameInvitation';
import TicTacToe from './TicTacToe';
import GameInvitePopup from './GameInvitePopup';
import CreateGroupChat from './CreateGroupChat';
import GroupChatRoom from './GroupChatRoom';
import useOutgoingGameWatch from '../hooks/useOutgoingGameWatch';
import { useAuth } from '../auth/AuthContext';

function UserInfo({ onLogout }) {
  const { currentUser } = useAuth();

  const handleLogout = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { online: false }, { merge: true });
    }

    try {
      await auth.signOut();
      onLogout();
      alert('Logged out successfully!');
    } catch (error) {
      alert('Logout failed: ' + error.message);
    }
  };

  return currentUser ? (
    <div style={{ marginBottom: '1rem' }}>
      <p>Logged in as: {currentUser.email}</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  ) : (
    <p>Not logged in</p>
  );
}

export default function MainApp() {
  const [selectedUser, setSelectedUser] = useState(null);
  const [friendsMap, setFriendsMap] = useState({});
  const [activeGameId, setActiveGameId] = useState(null);
  const [groupChats, setGroupChats] = useState([]);
  const [activeGroupChat, setActiveGroupChat] = useState(null);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const { currentUser } = useAuth();

  const handleLogout = () => {
    setSelectedUser(null);
    setActiveGameId(null);
    setActiveGroupChat(null);
  };

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

  useEffect(() => {
    if (!currentUser) return;

    const markOnline = async () => {
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, { online: true }, { merge: true });
    };

    markOnline();
  }, [currentUser]);

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

  useOutgoingGameWatch(currentUser, setActiveGameId);

  const handleUserSelect = (user) => {
    if (friendsMap[user.uid]) {
      setSelectedUser(user);
    } else {
      alert('You can only chat with your friends.');
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'groupChats'),
      where('members', 'array-contains', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setGroupChats(chats);
      setLoadingGroups(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  return (
    <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1rem' }}>🚀 Welcome to the Chat Game App</h1>

      <section style={{ marginBottom: '2rem' }}>
        <h2>🔐 Authentication</h2>
        <SignUp />
        <Login />
        <GoogleLoginButton />
        <UserInfo onLogout={handleLogout} />
      </section>

      {currentUser && (
        <>
          <section style={{ marginBottom: '2rem' }}>
            <h2>👥 Your Friends</h2>
            <UserList onUserSelect={handleUserSelect} />
            {selectedUser && <ChatWindow selectedUser={selectedUser} />}
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2>➕ Add & Manage Friends</h2>
            <FriendRequest />
            <FriendRequestsInbox />
            <FriendList />
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2>🎮 Start a Game</h2>
            <GameInvitation onGameCreated={setActiveGameId} />
            <GameInvitePopup onGameAccepted={setActiveGameId} />
            {activeGameId && (
              <TicTacToe gameId={activeGameId} onExit={() => setActiveGameId(null)} />
            )}
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2>💬 Group Chats</h2>
            <CreateGroupChat />
            {loadingGroups ? (
              <p>Loading group chats...</p>
            ) : (
              <>
                <ul>
                  {groupChats.map((chat) => (
                    <li key={chat.id}>
                      <button onClick={() => setActiveGroupChat(chat)}>💬 {chat.name}</button>
                    </li>
                  ))}
                </ul>
                {activeGroupChat && (
                  <GroupChatRoom
                    groupId={activeGroupChat.id}
                    groupName={activeGroupChat.name}
                  />
                )}
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}
