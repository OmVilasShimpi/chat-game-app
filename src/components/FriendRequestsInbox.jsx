// src/components/FriendRequestsInbox.jsx
import React, { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  deleteDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth/AuthContext';

export default function FriendRequestsInbox() {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'friendRequests'),
      where('to', '==', currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const reqs = await Promise.all(snapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        const senderRef = doc(db, 'users', data.from);
        const senderSnap = await getDoc(senderRef);
        return {
          id: docSnap.id,
          from: data.from,
          timestamp: data.timestamp,
          sender: senderSnap.data()
        };
      }));

      setRequests(reqs);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleAccept = async (req) => {
    try {
      const myFriendsRef = doc(db, 'friends', currentUser.uid);
      const theirFriendsRef = doc(db, 'friends', req.from);

      await setDoc(myFriendsRef, { [req.from]: true }, { merge: true });
      await setDoc(theirFriendsRef, { [currentUser.uid]: true }, { merge: true });

      await deleteDoc(doc(db, 'friendRequests', req.id));
    } catch (err) {
      alert("Failed to accept request: " + err.message);
    }
  };

  const handleReject = async (req) => {
    try {
      await deleteDoc(doc(db, 'friendRequests', req.id));
    } catch (err) {
      alert("Failed to reject request: " + err.message);
    }
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '12px', marginTop: '20px' }}>
      <h3>Incoming Friend Requests</h3>
      {requests.length === 0 ? (
        <p>No new friend requests.</p>
      ) : (
        requests.map((req) => (
          <div key={req.id} style={{ marginBottom: '10px' }}>
            <span>{req.sender.avatar || '👤'} <strong>{req.sender.username}</strong></span>
            <div style={{ marginTop: '5px' }}>
              <button style={{ marginRight: '10px' }} onClick={() => handleAccept(req)}>Accept</button>
              <button onClick={() => handleReject(req)}>Reject</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
