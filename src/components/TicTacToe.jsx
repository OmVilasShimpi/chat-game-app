import React, { useEffect, useState } from 'react';
import { doc, onSnapshot, updateDoc, getDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth/AuthContext';

export default function TicTacToe({ gameId, onExit }) {
  const { currentUser } = useAuth();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notAuthorized, setNotAuthorized] = useState(false);
  const [opponentName, setOpponentName] = useState("Opponent");
  const [stats, setStats] = useState({ wins: 0, losses: 0, draws: 0 });

  useEffect(() => {
    const gameRef = doc(db, 'games', gameId);
    const unsubscribe = onSnapshot(gameRef, async (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() };
        setGame(data);
        setLoading(false);

        if (!data.players.includes(currentUser.uid)) {
          setNotAuthorized(true);
        } else {
          setNotAuthorized(false);

          // Fetch opponent name
          const opponentId = data.players.find(uid => uid !== currentUser.uid);
          if (opponentId) {
            const opponentSnap = await getDoc(doc(db, 'users', opponentId));
            if (opponentSnap.exists()) {
              setOpponentName(opponentSnap.data().username || "Opponent");
            }
          }

          // Exit board if other player exited
          if (data.status === 'exited' && data.exitedBy !== currentUser.uid) {
            if (onExit) onExit();
          }

          // Live user stats
          const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
          if (userSnap.exists()) {
            const u = userSnap.data();
            setStats({
              wins: u.wins || 0,
              losses: u.losses || 0,
              draws: u.draws || 0
            });
          }
        }
      } else {
        alert('Game not found or deleted.');
        setGame(null);
        if (onExit) onExit();
      }
    });

    return () => unsubscribe();
  }, [gameId, currentUser, onExit]);

  const getSymbol = (uid) => {
    if (!game?.players) return '';
    return game.players[0] === uid ? 'X' : 'O';
  };

  const checkWinner = (board) => {
    const combos = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (let [a, b, c] of combos) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return game.players[board[a] === 'X' ? 0 : 1];
      }
    }
    if (board.every(cell => cell)) return 'draw';
    return null;
  };

  const updateStatsForBoth = async (winner) => {
    const [p1, p2] = game.players;
    const p1Ref = doc(db, 'users', p1);
    const p2Ref = doc(db, 'users', p2);

    if (winner === 'draw') {
      await updateDoc(p1Ref, { draws: increment(1) });
      await updateDoc(p2Ref, { draws: increment(1) });
    } else if (winner === p1) {
      await updateDoc(p1Ref, { wins: increment(1) });
      await updateDoc(p2Ref, { losses: increment(1) });
    } else {
      await updateDoc(p2Ref, { wins: increment(1) });
      await updateDoc(p1Ref, { losses: increment(1) });
    }
  };

  const handleMove = async (index) => {
    if (!game || game.status !== 'in_progress') return;
    if (currentUser.uid !== game.currentTurn) return;
    if (game.board[index]) return;

    const newBoard = [...game.board];
    newBoard[index] = getSymbol(currentUser.uid);
    const winner = checkWinner(newBoard);
    const nextPlayer = game.players.find(uid => uid !== currentUser.uid);

    await updateDoc(doc(db, 'games', gameId), {
      board: newBoard,
      currentTurn: winner ? null : nextPlayer,
      winner: winner === 'draw' ? 'draw' : winner || null,
      status: winner ? 'finished' : 'in_progress'
    });

    if (winner) await updateStatsForBoth(winner);
  };

  const handleExit = async () => {
    if (!game?.id) return;
    await updateDoc(doc(db, 'games', game.id), {
      status: 'exited',
      exitedBy: currentUser.uid
    });
    if (onExit) onExit();
  };

  const handlePlayAgain = async () => {
    if (!game) return;
    const newBoard = Array(9).fill(null);
    const firstTurn = game.players[Math.floor(Math.random() * 2)];

    await updateDoc(doc(db, 'games', game.id), {
      board: newBoard,
      currentTurn: firstTurn,
      winner: null,
      status: 'in_progress',
      exitedBy: null
    });
  };

  const renderStatus = () => {
    if (game.status === 'exited') {
      return <p style={{ color: 'red' }}>🚪 <strong>{game.exitedBy === currentUser.uid ? 'You' : opponentName} left the game.</strong></p>;
    }
    if (game.status === 'finished') {
      if (game.winner === 'draw') return <p style={{ color: 'gray' }}>🤝 <strong>It’s a Draw!</strong></p>;
      if (game.winner === currentUser.uid) return <p style={{ color: 'green' }}>🎉 <strong>You Won!</strong></p>;
      return <p style={{ color: 'red' }}>😢 <strong>You Lost.</strong></p>;
    }
    const isMyTurn = currentUser.uid === game.currentTurn;
    return <p>{isMyTurn ? "🕹️ Your turn" : "⌛ Waiting for opponent..."}</p>;
  };

  if (loading) return <p>Loading game...</p>;
  if (notAuthorized) return <p>❌ You are not a participant in this game.</p>;
  if (!game) return null;

  const symbol = getSymbol(currentUser.uid);
  const isMyTurn = currentUser.uid === game.currentTurn;

  return (
    <div style={{ marginTop: '20px', textAlign: 'center' }}>
      <h3>🎮 Tic Tac Toe</h3>
      <p>You are: <strong>{symbol}</strong></p>
      {renderStatus()}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 60px)',
        gap: '5px',
        justifyContent: 'center',
        marginTop: '10px'
      }}>
        {game.board.map((cell, idx) => (
          <div key={idx}
            onClick={() => handleMove(idx)}
            style={{
              width: '60px',
              height: '60px',
              border: '1px solid #333',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: '24px',
              cursor: game.status === 'in_progress' && !cell && isMyTurn ? 'pointer' : 'default',
              backgroundColor: cell ? '#eee' : 'white',
              pointerEvents: game.status === 'exited' ? 'none' : 'auto'
            }}>
            {cell}
          </div>
        ))}
      </div>

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#555' }}>
        <p><strong>Stats:</strong> 🏆 Wins: {stats.wins} | 😞 Losses: {stats.losses} | 🤝 Draws: {stats.draws}</p>
      </div>

      {(game.status === 'finished' || (game.status === 'exited' && game.exitedBy === currentUser.uid)) && (
        <div style={{ marginTop: '16px' }}>
          <button onClick={handlePlayAgain} style={{ marginRight: '10px' }}>🔁 Play Again</button>
          <button onClick={handleExit}>❌ Exit</button>
        </div>
      )}
    </div>
  );
}
