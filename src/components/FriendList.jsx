// src/components/FriendList.jsx
import React, { useEffect, useState } from 'react';
import { doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth/AuthContext';

export default function FriendList() {
  const { currentUser } = useAuth();
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    const loadFriends = async () => {
      if (!currentUser) return;

      try {
        const friendsRef = doc(db, 'friends', currentUser.uid);
        const friendsSnap = await getDoc(friendsRef);

        if (!friendsSnap.exists()) {
          setFriends([]);
          return;
        }

        const friendUids = Object.keys(friendsSnap.data());
        const friendProfiles = [];

        for (const uid of friendUids) {
          const userRef = doc(db, 'users', uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            friendProfiles.push(userSnap.data());
          }
        }

        setFriends(friendProfiles);
      } catch (error) {
        console.error("Failed to load friends:", error);
      }
    };

    loadFriends();
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
              {friend.avatar || '👤'} <strong>{friend.username}</strong>
              {' '}
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
