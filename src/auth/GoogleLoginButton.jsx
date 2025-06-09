// src/auth/GoogleLoginButton.jsx
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import app from '../firebase';

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export default function GoogleLoginButton() {
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userRef);

      if (!docSnap.exists()) {
        // Set default profile if user doesn't exist in Firestore
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          username: user.displayName || "GoogleUser",
          avatar: "👤", // default avatar
          online: true,
          createdAt: new Date()
        });
      }

      alert("Logged in with Google!");
    } catch (error) {
      alert(error.message);
    }
  };

  return <button onClick={handleGoogleLogin}>Login with Google</button>;
}
