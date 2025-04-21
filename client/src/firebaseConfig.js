// src/firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth'; // Import GoogleAuthProvider
import { getAnalytics } from 'firebase/analytics';

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
const googleProvider = new GoogleAuthProvider(); // Initialize GoogleAuthProvider

export { app, analytics, auth, googleProvider }; // Export googleProvider