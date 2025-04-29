import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyDgy5oBH_JyyFPsrDoLPMw-L6jH4_J2K_4",
    authDomain: "smartchef-app-c4b56.firebaseapp.com",
    projectId: "smartchef-app-c4b56",
    storageBucket: "smartchef-app-c4b56.appspot.com", // corrected typo: .app → .com
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

export { app, analytics, auth, googleProvider, db, storage };