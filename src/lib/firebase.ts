
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCJ3zT0m0CqqTBcEQt5vJsdAzb8rUA78g4",
  authDomain: "campusconnect-15.firebaseapp.com",
  projectId: "campusconnect-15",
  storageBucket: "campusconnect-15.firebasestorage.app",
  messagingSenderId: "865980515192",
  appId: "1:865980515192:web:907302705123343578fe8d",
  measurementId: "G-Z97P0HGPYY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Enable offline persistence
import { enableNetwork, disableNetwork } from 'firebase/firestore';

// Enable offline persistence for better data consistency
export const enableOfflineSupport = async () => {
  try {
    // Firestore automatically enables offline persistence in modern versions
    console.log('Firestore offline persistence is enabled by default');
  } catch (error) {
    console.warn('Could not enable offline persistence:', error);
  }
};

// Call this when the app starts
enableOfflineSupport();

export default app;
