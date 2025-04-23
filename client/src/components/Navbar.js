import { useLocation } from 'react-router-dom';  // Add this at the top
import { Link } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import { signOut } from 'firebase/auth';
import { useState } from 'react';
import { FiMenu, FiX, FiBookmark, FiUser, FiLogOut } from 'react-icons/fi';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const location = useLocation(); // Track current route

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Add active link styling
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <Link 
            to="/dashboard" 
            className={`text-xl font-bold ${isActive('/dashboard') ? 'text-blue-600' : 'text-gray-800'}`}
          >
            SmartChef
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link 
              to="/saved" 
              className={`flex items-center px-3 py-2 ${isActive('/saved') ? 'text-blue-600 font-medium' : 'text-gray-700 hover:text-blue-600'}`}
            >
              <FiBookmark className="mr-1" /> Saved
            </Link>
            
            {/* Profile dropdown remains the same */}
            <div className="relative">
              <button 
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center px-3 py-2 text-gray-700 hover:text-blue-600"
              >
                <FiUser className="mr-1" /> Profile
              </button>
              
              {showProfileDropdown && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                  <Link
                    to="/profile"
                    className={`block px-4 py-2 text-sm ${isActive('/profile') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-blue-50'}`}
                  >
                    View Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 flex items-center"
                  >
                    <FiLogOut className="mr-2" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button - remains the same */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-blue-600 focus:outline-none"
            >
              {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-white pb-3 px-4">
          <Link
            to="/saved"
            className={`block px-3 py-2 ${isActive('/saved') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-blue-50'} rounded`}
          >
            <FiBookmark className="inline mr-2" /> Saved Recipes
          </Link>
          <Link
            to="/profile"
            className={`block px-3 py-2 ${isActive('/profile') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-blue-50'} rounded`}
          >
            <FiUser className="inline mr-2" /> Profile
          </Link>
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 text-gray-700 hover:bg-blue-50 rounded flex items-center"
          >
            <FiLogOut className="mr-2" /> Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;