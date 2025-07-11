// src/components/UserList.jsx
import React, { useEffect, useState } from 'react';
import { collection, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth/AuthContext';

export default function UserList({ onUserSelect }) {
  const { currentUser } = useAuth();
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    const fetchFriends = async () => {
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
        console.error('Failed to fetch friends:', error);
        setFriends([]);
      }
    };

    fetchFriends();
  }, [currentUser]);

  return (
    <div>
      <h3>Available Users</h3>
      {friends.length === 0 ? (
        <p>No friends to show.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {friends.map((user) => (
            <li
              key={user.uid}
              onClick={() => onUserSelect(user)}
              style={{ cursor: 'pointer', marginBottom: '8px' }}
            >
              <span style={{ fontSize: '20px' }}>{user.avatar || '👤'}</span>{' '}
              <strong>{user.username}</strong>{' '}
              <span style={{ color: user.online ? 'green' : 'gray' }}>
                ● {user.online ? 'Online' : 'Offline'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
