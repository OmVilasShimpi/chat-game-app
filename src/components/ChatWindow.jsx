// src/components/ChatWindow.jsx
import React, { useEffect, useState, useRef } from 'react';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  doc,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../auth/AuthContext';

export default function ChatWindow({ selectedUser }) {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userProfiles, setUserProfiles] = useState({});
  const bottomRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const chatId = [currentUser.uid, selectedUser.uid].sort().join('_');
  const typingRef = doc(db, 'chats', chatId, 'typingStatus', 'status');
  const selectedUserRef = doc(db, 'users', selectedUser.uid);

  // 📥 Load sender/receiver profiles
  useEffect(() => {
    const loadProfiles = async () => {
      const senderDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const receiverDoc = await getDoc(doc(db, 'users', selectedUser.uid));

      setUserProfiles({
        [currentUser.uid]: senderDoc.data(),
        [selectedUser.uid]: receiverDoc.data()
      });
    };

    loadProfiles();
  }, [selectedUser]);

  // 🔁 Listen to messages and update delivered/seen if recipient
  useEffect(() => {
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const msgs = [];

      for (const docSnap of snapshot.docs) {
        const msg = { id: docSnap.id, ...docSnap.data() };

        if (
          msg.senderId !== currentUser.uid &&
          (!msg.delivered || !msg.seen)
        ) {
          const msgRef = doc(db, 'chats', chatId, 'messages', docSnap.id);

          await setDoc(
            msgRef,
            { delivered: true, seen: true },
            { merge: true }
          );

          msg.delivered = true;
          msg.seen = true;
        }

        msgs.push(msg);
      }

      setMessages(msgs);

      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => unsubscribe();
  }, [chatId]);

  useEffect(() => {
    const unsubscribeTyping = onSnapshot(typingRef, (docSnap) => {
      const data = docSnap.data();
      if (data?.typing && data?.typedBy !== currentUser.uid) {
        setIsTyping(true);
      } else {
        setIsTyping(false);
      }

      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => unsubscribeTyping();
  }, [chatId]);

  useEffect(() => {
    const unsubscribeStatus = onSnapshot(selectedUserRef, (docSnap) => {
      const data = docSnap.data();
      if (data && !data.online) {
        alert(`${selectedUser.username} has gone offline. Chat will close.`);
        window.location.reload();
      }
    });

    return () => unsubscribeStatus();
  }, [selectedUser]);

  const handleTyping = async (e) => {
    setNewMessage(e.target.value);

    await setDoc(typingRef, {
      typing: true,
      typedBy: currentUser.uid
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(async () => {
      await setDoc(typingRef, {
        typing: false,
        typedBy: currentUser.uid
      });
    }, 1000);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;

    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      text: newMessage,
      senderId: currentUser.uid,
      timestamp: new Date(),
      delivered: false,
      seen: false
    });

    setNewMessage('');
    await setDoc(typingRef, {
      typing: false,
      typedBy: currentUser.uid
    });
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '16px', marginTop: '16px' }}>
      <h3>Chat with {selectedUser.username}</h3>
      <div style={{ height: '200px', overflowY: 'auto', marginBottom: '10px' }}>
        {messages.map((msg, idx) => {
          const sender = userProfiles[msg.senderId];
          const time = msg.timestamp?.toDate().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div
              key={msg.id || idx}
              style={{
                textAlign: msg.senderId === currentUser.uid ? 'right' : 'left',
                marginBottom: '10px',
                padding: '6px 0'
              }}
            >
              <div>
                <strong>{sender?.avatar || '👤'} {sender?.username || 'User'}:</strong>
              </div>
              <div>{msg.text}</div>
              {time && <small style={{ color: '#888' }}>🕒 {time}</small>}
              {msg.senderId === currentUser.uid && (
                <div>
                  <small style={{ color: msg.seen ? 'green' : msg.delivered ? 'blue' : 'gray' }}>
                    {msg.seen ? '✓✓ Seen' : msg.delivered ? '✓ Delivered' : 'Sent'}
                  </small>
                </div>
              )}
            </div>
          );
        })}
        {isTyping && (
          <p style={{ fontStyle: 'italic', color: '#888' }}>
            {selectedUser.username} is typing...
          </p>
        )}
        <div ref={bottomRef}></div>
      </div>
      <form onSubmit={handleSend}>
        <input
          type="text"
          placeholder="Type your message..."
          value={newMessage}
          onChange={handleTyping}
          style={{ width: '80%' }}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
