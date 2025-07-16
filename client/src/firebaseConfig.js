import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  updateProfile,
  deleteUser
} from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';
import { 
  getFirestore, 
  enableIndexedDbPersistence,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  onSnapshot
} from 'firebase/firestore';
import { 
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';

// Hardcoded config (temporarily for testing)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: "smartchef-app-c4b56.firebaseapp.com",
  projectId: "smartchef-app-c4b56",
  storageBucket: "smartchef-app-c4b56.firebasestorage.app", // Fixed: Use the correct storage bucket
  messagingSenderId: "681401308799",
  appId: "1:681401308799:web:5799700cbd71d74b24d14a",
  measurementId: "G-328ZVJRKKQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);
const storage = getStorage(app);

// Enable offline persistence with strict equality checks
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn("Offline persistence can only be enabled in one tab at a time.");
  } else if (err.code === 'unimplemented') {
    console.warn("The current browser does not support all required features for offline persistence.");
  }
});

export { 
  app,
  analytics,
  auth,
  googleProvider,
  db,
  storage,
  updateProfile,
  deleteUser,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  onSnapshot,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
};