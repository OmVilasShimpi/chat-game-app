import React, { useEffect, useRef, useState } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth/AuthContext';

export default function GroupChatRoom({ groupId, groupName }) {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [myUsername, setMyUsername] = useState('');
  const messagesEndRef = useRef(null);

  // Fetch current user's username once
  useEffect(() => {
    if (!currentUser) return;

    const fetchUsername = async () => {
      const userRef = doc(db, 'users', currentUser.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        setMyUsername(data.username || currentUser.email);
      }
    };

    fetchUsername();
  }, [currentUser]);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Real-time message listener
  useEffect(() => {
    if (!groupId) return;

    const messagesRef = collection(db, 'groupChats', groupId, 'messages');
    const q = query(messagesRef, orderBy('timestamp'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [groupId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messagesRef = collection(db, 'groupChats', groupId, 'messages');

    await addDoc(messagesRef, {
      text: newMessage.trim(),
      senderId: currentUser.uid,
      senderName: myUsername,
      timestamp: serverTimestamp()
    });

    setNewMessage('');
  };

  return (
    <div style={{
      border: '1px solid #ccc',
      padding: '16px',
      marginTop: '20px',
      maxHeight: '400px',
      overflowY: 'auto'
    }}>
      <h2>Group: {groupName}</h2>
      <div style={{ marginBottom: '16px' }}>
        {messages.map(msg => (
          <div key={msg.id} style={{
            background: msg.senderId === currentUser.uid ? '#dcf8c6' : '#f1f0f0',
            padding: '8px',
            borderRadius: '8px',
            margin: '4px 0',
            textAlign: msg.senderId === currentUser.uid ? 'right' : 'left'
          }}>
            <strong>{msg.senderName}</strong><br />
            {msg.text}
          </div>
        ))}
        <div ref={messagesEndRef}></div>
      </div>

      <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message"
          style={{ flex: 1 }}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
