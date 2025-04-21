// /components/Navbar.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebaseConfig'; // Make sure Firebase is initialized correctly
import { signOut } from 'firebase/auth';

const Navbar = () => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error.message);
    }
  };

  return (
    <div className="bg-gray-800 p-4 text-white flex justify-between items-center">
      <h1 className="text-2xl font-semibold">SmartChef</h1>
      <div className="flex items-center space-x-4">
        <button onClick={() => navigate('/profile')} className="hover:text-gray-400">Profile</button>
        <button onClick={() => navigate('/saved-recipes')} className="hover:text-gray-400">Saved Recipes</button>
        <button onClick={handleSignOut} className="bg-red-500 px-4 py-2 rounded hover:bg-red-600">Sign Out</button>
      </div>
    </div>
  );
};

export default Navbar;