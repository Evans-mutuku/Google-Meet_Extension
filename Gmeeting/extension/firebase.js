import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyBqRGfNOCRA06URvZ8VD8Ny8paPTpuqCfw",
  authDomain: "mentorship-74ad7.firebaseapp.com",
  projectId: "mentorship-74ad7",
  storageBucket: "mentorship-74ad7.firebasestorage.app",
  messagingSenderId: "1035391211182",
  appId: "1:1035391211182:web:304c3b302b4433b8593f3f",
  measurementId: "G-LQ9EKJ7347"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db }; 