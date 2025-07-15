import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableNetwork, disableNetwork } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

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

// Initialize messaging for notifications
let messaging = null;
try {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    messaging = getMessaging(app);
  }
} catch (error) {
  console.warn('Firebase messaging not available:', error);
}

export { messaging };

// Enable offline persistence
export const enableOfflineSupport = async () => {
  try {
    console.log('Firestore offline persistence is enabled by default');
  } catch (error) {
    console.warn('Could not enable offline persistence:', error);
  }
};

// FCM token management
export const getFCMToken = async () => {
  if (!messaging) return null;
  
  try {
    const token = await getToken(messaging, {
      vapidKey: 'YOUR_VAPID_KEY' // You'll need to add this
    });
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

// Listen for foreground messages
export const onForegroundMessage = (callback: (payload: any) => void) => {
  if (!messaging) return () => {};
  
  return onMessage(messaging, callback);
};

// Call this when the app starts
enableOfflineSupport();

export default app;