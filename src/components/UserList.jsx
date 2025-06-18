// src/components/UserList.jsx
import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth/AuthContext';

export default function UserList({ onUserSelect }) {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const userList = snapshot.docs
        .map(doc => doc.data())
        .filter(user => user.uid !== currentUser?.uid); // exclude self
      setUsers(userList);
    });

    return () => unsubscribe();
  }, [currentUser]);

  return (
    <div>
      <h3>Available Users</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {users.map(user => (
          <li key={user.uid} onClick={() => onUserSelect(user)} style={{ cursor: 'pointer', marginBottom: '8px' }}>
            <span style={{ fontSize: '20px' }}>{user.avatar || '👤'}</span>{' '}
            <strong>{user.username}</strong>{' '}
            <span style={{ color: user.online ? 'green' : 'gray' }}>
              ● {user.online ? 'Online' : 'Offline'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
