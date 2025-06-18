// src/components/GameInvitePopup.jsx
import React, { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth/AuthContext';

export default function GameInvitePopup({ onGameAccepted }) {
  const { currentUser } = useAuth();
  const [invite, setInvite] = useState(null);
  const [senderName, setSenderName] = useState("Player");

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'gameInvites'),
      where('to', '==', currentUser.uid),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const invites = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const firstInvite = invites.length > 0 ? invites[0] : null;
      setInvite(firstInvite);

      if (firstInvite) {
        const senderRef = doc(db, 'users', firstInvite.from);
        const snap = await getDoc(senderRef);
        if (snap.exists()) {
          setSenderName(snap.data().username || "Player");
        }
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleReject = async () => {
    if (!invite) return;
    await deleteDoc(doc(db, 'gameInvites', invite.id));
    setInvite(null);
  };

  const handleAccept = async () => {
    if (!invite) return;

    // ✅ Check if there's already an active game
    const gamesRef = query(
      collection(db, 'games'),
      where('players', 'array-contains', currentUser.uid),
      where('status', '==', 'in_progress')
    );

    const activeGamesSnap = await getDoc(doc(db, 'games', `${invite.from}_${invite.to}_${Date.now()}`));

    if (activeGamesSnap.exists()) {
      alert("You are already in a game.");
      return;
    }

    const gameId = `${invite.from}_${invite.to}_${Date.now()}`;
    const gameRef = doc(db, 'games', gameId);

    try {
      await setDoc(gameRef, {
        players: [invite.from, invite.to],
        board: Array(9).fill(null),
        currentTurn: invite.from,
        winner: null,
        status: 'in_progress',
        createdAt: serverTimestamp()
      });

      await deleteDoc(doc(db, 'gameInvites', invite.id));
      setInvite(null);
      if (onGameAccepted) onGameAccepted(gameId);
    } catch (err) {
      alert("Failed to start game: " + err.message);
    }
  };

  if (!invite) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '30px',
      right: '30px',
      background: '#fff',
      padding: '16px',
      border: '2px solid #333',
      borderRadius: '8px',
      boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
      zIndex: 1000
    }}>
      <p><strong>{senderName}</strong> invited you to play <em>{invite.gameType}</em>!</p>
      <div style={{ marginTop: '10px' }}>
        <button onClick={handleAccept} style={{ marginRight: '10px' }}>✅ Accept</button>
        <button onClick={handleReject}>❌ Reject</button>
      </div>
    </div>
  );
}
