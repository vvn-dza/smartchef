import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebaseConfig';
import { RecipesProvider } from './context/RecipesContext';
import { SavedRecipesProvider } from './context/SavedRecipesContext'; // New
import Login from './authentication/Login';
import SignUp from './authentication/SignUp';
import Dashboard from './pages/Dashboard';
import SavedRecipes from './pages/SavedRecipes'; // New
import RecipeDetail from './pages/RecipeDetail'; // New
import Layout from './components/Layout'; // New

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Monitor authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <RecipesProvider>
      <SavedRecipesProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
            <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <SignUp />} />
            
            {/* Protected Routes with Layout */}
            <Route element={<Layout />}>
              <Route 
                path="/dashboard" 
                element={user ? <Dashboard /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/saved" 
                element={user ? <SavedRecipes /> : <Navigate to="/login" />} 
              />
              <Route 
                path="/recipe/:id" 
                element={user ? <RecipeDetail /> : <Navigate to="/login" />} 
              />
            </Route>

            {/* Default Route */}
            <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
            
            {/* 404 Route */}
            <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
          </Routes>
        </Router>
      </SavedRecipesProvider>
    </RecipesProvider>
  );
};

export default App;