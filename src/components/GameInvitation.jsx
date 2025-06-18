// src/components/GameInvitation.jsx
import React, { useEffect, useState } from 'react';
import {
  collection,
  doc,
  getDoc,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth/AuthContext';

export default function GameInvitation({ onGameCreated }) {
  const { currentUser } = useAuth();
  const [friends, setFriends] = useState([]);
  const [myUsername, setMyUsername] = useState("Player");

  useEffect(() => {
    const loadUserAndFriends = async () => {
      if (!currentUser) return;

      const myRef = doc(db, 'users', currentUser.uid);
      const mySnap = await getDoc(myRef);
      if (mySnap.exists()) {
        setMyUsername(mySnap.data().username || "Player");
      }

      const friendRef = doc(db, 'friends', currentUser.uid);
      const snap = await getDoc(friendRef);
      if (!snap.exists()) {
        setFriends([]);
        return;
      }

      const friendUids = Object.keys(snap.data());
      const profiles = [];

      for (const uid of friendUids) {
        const userRef = doc(db, 'users', uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          profiles.push(userSnap.data());
        }
      }

      setFriends(profiles);
    };

    loadUserAndFriends();
  }, [currentUser]);

  const checkActiveGame = async (uid) => {
    const gameQuery = query(
      collection(db, 'games'),
      where('players', 'array-contains', uid),
      where('status', '==', 'in_progress')
    );
    const snapshot = await getDocs(gameQuery);
    return !snapshot.empty;
  };

  const handleInvite = async (friend) => {
    try {
      const inviterInGame = await checkActiveGame(currentUser.uid);
      const friendInGame = await checkActiveGame(friend.uid);

      if (inviterInGame || friendInGame) {
        alert("Either you or the friend is already in a game.");
        return;
      }

      await addDoc(collection(db, 'gameInvites'), {
        from: currentUser.uid,
        to: friend.uid,
        username: myUsername,
        gameType: 'tic-tac-toe',
        status: 'pending',
        timestamp: serverTimestamp()
      });

      alert(`Game invite sent to ${friend.username}`);
    } catch (err) {
      alert("Failed to send invite: " + err.message);
    }
  };

  return (
    <div style={{ border: '1px solid #aaa', padding: '10px', marginTop: '20px' }}>
      <h3>🎮 Start Tic-Tac-Toe Game</h3>
      {friends.length === 0 ? (
        <p>No friends available.</p>
      ) : (
        <ul>
          {friends.map(friend => (
            <li key={friend.uid} style={{ marginBottom: '8px' }}>
              {friend.avatar || '👤'} <strong>{friend.username}</strong>{' '}
              <span style={{ color: friend.online ? 'green' : 'red' }}>
                {friend.online ? '🟢 Online' : '🔴 Offline'}
              </span>{' '}
              <button
                onClick={() => handleInvite(friend)}
                disabled={!friend.online}
                style={{
                  opacity: friend.online ? 1 : 0.5,
                  cursor: friend.online ? 'pointer' : 'not-allowed',
                  marginLeft: '10px'
                }}
              >
                Invite
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
