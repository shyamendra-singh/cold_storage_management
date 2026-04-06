import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Replace with your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAkCNMsmhAAucOXci6mrKH5m_FTMXhyV4Y",
  authDomain: "cold-storage-f9f87.firebaseapp.com",
  projectId: "cold-storage-f9f87",
  storageBucket: "cold-storage-f9f87.firebasestorage.app",
  messagingSenderId: "671848390594",
  appId: "1:671848390594:web:e38bed5bfc362ee302805b",
  measurementId: "G-17ZEG021MG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

export default app;
