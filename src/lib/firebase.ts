import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Firebase初期化
const app = initializeApp(firebaseConfig);

// Auth と Firestore の初期化（クライアントサイドのみ）
let auth: any = null;
let db: any = null;

if (typeof window !== 'undefined') {
  const { getAuth } = require('firebase/auth');
  const { getFirestore } = require('firebase/firestore');
  auth = getAuth(app);
  db = getFirestore(app);
}

export { auth, db };
export default app; 
