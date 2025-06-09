// src/App.jsx
import React from 'react';
import SignUp from './auth/SignUp';
import Login from './auth/Login';
import GoogleLoginButton from './auth/GoogleLoginButton';
import { AuthProvider, useAuth } from './auth/AuthContext';

function UserInfo() {
  const { currentUser } = useAuth();
  return currentUser ? <p>Logged in as: {currentUser.email}</p> : <p>Not logged in</p>;
}

function App() {
  return (
    <AuthProvider>
      <h1>Firebase Auth Example</h1>
      <SignUp />
      <Login />
      <GoogleLoginButton />
      <UserInfo />
    </AuthProvider>
  );
}

export default App;
