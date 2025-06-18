// src/auth/SignUp.jsx
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import {
  getFirestore,
  setDoc,
  doc,
  getDocs,
  query,
  collection,
  where
} from 'firebase/firestore';
import app from '../firebase';
import React, { useState } from 'react';

const auth = getAuth(app);
const db = getFirestore(app);

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('');

  const handleSignup = async (e) => {
    e.preventDefault();

    try {
      // 🔍 Check if username already exists
      const usernameQuery = query(
        collection(db, 'users'),
        where('username', '==', username)
      );
      const existing = await getDocs(usernameQuery);

      if (!existing.empty) {
        alert('Username is already taken. Please choose another one.');
        return;
      }

      // ✅ Continue registration
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCred.user.uid;

      await setDoc(doc(db, 'users', uid), {
        uid,
        email,
        username,
        avatar,
        online: true,
        createdAt: new Date()
      });

      alert('User signed up and profile saved!');
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <form onSubmit={handleSignup}>
      <h2>Sign Up</h2>
      <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
      <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
      <input type="text" placeholder="Username" onChange={(e) => setUsername(e.target.value)} />

      <p>Select an avatar:</p>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
        {['😎', '😊', '👩‍💻', '🐱', '🐶', '👾', '🧠', '🎮', '🚀', '🧑‍🚀'].map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => setAvatar(emoji)}
            style={{
              fontSize: '24px',
              padding: '10px',
              border: avatar === emoji ? '2px solid blue' : '1px solid gray',
              borderRadius: '8px',
              cursor: 'pointer',
              background: 'white'
            }}
          >
            {emoji}
          </button>
        ))}
      </div>

      <button type="submit">Register</button>
    </form>
  );
}
