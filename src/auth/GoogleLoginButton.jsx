// src/auth/GoogleLoginButton.jsx
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import app from '../firebase';

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export default function GoogleLoginButton() {
  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
      alert('Logged in with Google!');
    } catch (error) {
      alert(error.message);
    }
  };

  return <button onClick={handleGoogleLogin}>Login with Google</button>;
}
