import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase 설정
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyCtzXpPZHPs0vqigT1SzAypdsmVcwQY7jw",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "sweat-bridge.firebaseapp.com",
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL || "https://sweat-bridge-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "sweat-bridge",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "sweat-bridge.appspot.com",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "902416751358",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:902416751358:web:a0c7761b2dc56f51fc23af"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// Firebase 서비스 내보내기
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app; 