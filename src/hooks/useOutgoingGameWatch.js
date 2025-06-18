// src/hooks/useOutgoingGameWatch.js
import { useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';

export default function useOutgoingGameWatch(currentUser, onGameStarted) {
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'games'),
      where('players', 'array-contains', currentUser.uid),
      where('status', '==', 'in_progress')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.forEach(docSnap => {
        const game = docSnap.data();
        const gameId = docSnap.id;

        // Optional: filter out stale games by timestamp if needed
        if (game.players.includes(currentUser.uid)) {
          onGameStarted(gameId);
        }
      });
    });

    return () => unsubscribe();
  }, [currentUser, onGameStarted]);
}
