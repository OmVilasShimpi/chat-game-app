// src/components/FriendList.jsx
import React, { useEffect, useState } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth/AuthContext';

export default function FriendList() {
  const { currentUser } = useAuth();
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    if (!currentUser) return;

    const loadLiveFriends = async () => {
      const friendsRef = doc(db, 'friends', currentUser.uid);
      const friendsSnap = await getDoc(friendsRef);

      if (!friendsSnap.exists()) {
        setFriends([]);
        return;
      }

      const friendUids = Object.keys(friendsSnap.data());
      const unsubscribers = [];
      const liveFriends = [];

      friendUids.forEach((uid) => {
        const userRef = doc(db, 'users', uid);
        const unsub = onSnapshot(userRef, (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            liveFriends.push(data);
            // Once we have all, update state
            if (liveFriends.length === friendUids.length) {
              setFriends([...liveFriends]);
            }
          }
        });
        unsubscribers.push(unsub);
      });

      return () => {
        unsubscribers.forEach(unsub => unsub());
      };
    };

    const cleanup = loadLiveFriends();

    return () => {
      if (cleanup instanceof Function) cleanup();
    };
  }, [currentUser]);

  return (
    <div style={{ border: '1px solid #ccc', padding: '12px', marginTop: '20px' }}>
      <h3>Your Friends</h3>
      {friends.length === 0 ? (
        <p>You have no friends yet.</p>
      ) : (
        <ul>
          {friends.map((friend) => (
            <li key={friend.uid} style={{ marginBottom: '8px' }}>
              {friend.avatar || '👤'} <strong>{friend.username}</strong>{' '}
              <span style={{ color: friend.online ? 'green' : 'red' }}>
                {friend.online ? '🟢 Online' : '🔴 Offline'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
