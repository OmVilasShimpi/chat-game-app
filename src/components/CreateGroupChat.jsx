// src/components/CreateGroupChat.jsx
import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import {
  collection,
  addDoc,
  getDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { useAuth } from '../auth/AuthContext';

export default function CreateGroupChat() {
  const { currentUser } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [friends, setFriends] = useState([]);
  const [selectedFriendIds, setSelectedFriendIds] = useState([]);

  useEffect(() => {
    const fetchFriends = async () => {
      if (!currentUser) return;
      const friendRef = doc(db, 'friends', currentUser.uid);
      const friendSnap = await getDoc(friendRef);

      if (friendSnap.exists()) {
        const friendIds = Object.keys(friendSnap.data() || {});
        const fetchedFriends = [];

        for (const uid of friendIds) {
          const userRef = doc(db, 'users', uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            fetchedFriends.push({ uid, ...userSnap.data() });
          }
        }

        setFriends(fetchedFriends);
      }
    };

    fetchFriends();
  }, [currentUser]);

  const toggleSelection = (uid) => {
    setSelectedFriendIds((prev) =>
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedFriendIds.length === 0) {
      return alert('Please enter a group name and select friends.');
    }

    const members = [...selectedFriendIds, currentUser.uid];

    await addDoc(collection(db, 'groupChats'), {
      name: groupName.trim(),
      members,
      createdBy: currentUser.uid,
      createdAt: serverTimestamp()
    });

    alert('Group chat created successfully!');
    setGroupName('');
    setSelectedFriendIds([]);
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '16px', marginTop: '20px' }}>
      <h3>Create Group Chat</h3>
      <input
        type="text"
        placeholder="Enter group name"
        value={groupName}
        onChange={(e) => setGroupName(e.target.value)}
        style={{ width: '100%', marginBottom: '10px' }}
      />
      <div>
        {friends.map((friend) => (
          <label key={friend.uid} style={{ display: 'block', margin: '4px 0' }}>
            <input
              type="checkbox"
              checked={selectedFriendIds.includes(friend.uid)}
              onChange={() => toggleSelection(friend.uid)}
            />
            {' '}
            {friend.username || 'Unnamed User'}
          </label>
        ))}
      </div>
      <button onClick={handleCreateGroup} style={{ marginTop: '10px' }}>
        ➕ Create Group
      </button>
    </div>
  );
}
