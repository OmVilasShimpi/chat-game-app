// src/components/FriendRequest.jsx
import React, { useState } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth/AuthContext';

export default function FriendRequest() {
  const { currentUser } = useAuth();
  const [searchUsername, setSearchUsername] = useState('');
  const [result, setResult] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setResult(null);
    setNotFound(false);
    setRequestSent(false);

    const q = query(collection(db, 'users'), where('username', '==', searchUsername));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const userData = snapshot.docs[0].data();

      // Don't allow sending request to self
      if (userData.uid === currentUser.uid) {
        alert("You can't send a friend request to yourself.");
        return;
      }

      setResult(userData);
    } else {
      setNotFound(true);
    }
  };

  const handleSendRequest = async () => {
    try {
      await addDoc(collection(db, 'friendRequests'), {
        from: currentUser.uid,
        to: result.uid,
        timestamp: new Date()
      });

      setRequestSent(true);
    } catch (error) {
      alert('Failed to send request: ' + error.message);
    }
  };

  return (
    <div style={{ border: '1px solid #aaa', padding: '12px', marginTop: '20px' }}>
      <h3>Find Friends</h3>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Enter username"
          value={searchUsername}
          onChange={(e) => setSearchUsername(e.target.value)}
          style={{ marginRight: '10px' }}
        />
        <button type="submit">Search</button>
      </form>

      {notFound && <p style={{ color: 'red' }}>User not found</p>}

      {result && (
        <div style={{ marginTop: '10px' }}>
          <p>
            {result.avatar || '👤'} <strong>{result.username}</strong>
          </p>
          {requestSent ? (
            <p style={{ color: 'green' }}>Friend request sent!</p>
          ) : (
            <button onClick={handleSendRequest}>Send Friend Request</button>
          )}
        </div>
      )}
    </div>
  );
}
