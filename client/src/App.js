import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebaseConfig'; // Make sure this is the correct path
import Login from './authentication/Login';
import SignUp from './authentication/SignUp';
import Dashboard from './pages/Dashboard';

const App = () => {
  const [user, setUser] = useState(null);

  // Monitor authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser); // User is logged in
      } else {
        setUser(null); // User is not logged in
      }
    });

    return () => unsubscribe(); // Clean up on unmount
  }, []);

  return (
    <Router>
      <Routes>
        {/* Login route - Redirect to dashboard if logged in */}
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" /> : <Login />}
        />
        
        {/* Sign up route */}
        <Route path="/signup" element={<SignUp />} />
        
        {/* Protected Dashboard route - Only accessible if the user is logged in */}
        <Route
          path="/dashboard"
          element={user ? <Dashboard /> : <Navigate to="/login" />}
        />

        {/* Default route (login) */}
        <Route path="/" element={<Login />} />
      </Routes>
    </Router>
  );
};

export default App;