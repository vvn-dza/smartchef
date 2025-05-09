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

const firebaseConfig = {
  apiKey: "AIzaSyDgy5oBH_JyyFPsrDoLPMw-L6jH4_J2K_4",
  authDomain: "smartchef-app-c4b56.firebaseapp.com",
  projectId: "smartchef-app-c4b56",
  storageBucket: "smartchef-app-c4b56.firebasestorage.app",
  messagingSenderId: "681401308799",
  appId: "1:681401308799:web:5799700cbd71d74b24d14a",
  measurementId: "G-328ZVJRKKQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const db = getFirestore(app);
const storage = getStorage(app);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
    console.warn("Offline persistence can only be enabled in one tab at a time.");
  } else if (err.code == 'unimplemented') {
    console.warn("The current browser does not support all of the features required to enable offline persistence.");
  }
});

// Export all required Firebase functions and references
export { 
  app,
  analytics,
  auth,
  googleProvider,
  db,
  storage,
  // Auth functions
  updateProfile,
  deleteUser,
  // Firestore functions
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  onSnapshot,
  // Storage functions
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
};