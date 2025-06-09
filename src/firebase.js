// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD4Iom4gvZ2NqJZwdTAYWu8oWo23p91L_g",
  authDomain: "chat-game-app-b1895.firebaseapp.com",
  projectId: "chat-game-app-b1895",
  storageBucket: "chat-game-app-b1895.firebasestorage.app",
  messagingSenderId: "830487815082",
  appId: "1:830487815082:web:9c6c0f98fcccb10f63c1d3",
  measurementId: "G-GBRYV9G6PC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const db = getFirestore(app);
export default app;