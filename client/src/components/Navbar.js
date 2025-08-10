// src/components/Navbar.js

import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiMenu, FiX, FiBell, FiUser, FiLogOut } from 'react-icons/fi';
import { signOut } from 'firebase/auth';
import { auth, db, collection } from '../firebaseConfig';
import { getDocs, deleteDoc } from 'firebase/firestore';
import { useRecipes } from '../context/RecipesContext';
import notificationService from '../services/notificationService';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notificationAnimation, setNotificationAnimation] = useState(false);
  const notificationsRef = useRef(null);
  const dropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    allRecipes,
    user: recipesUser,
    setSelectedRecipe
  } = useRecipes();
  const user = auth.currentUser || recipesUser;

  // Add notification sound/animation function to window
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.triggerNotificationAlert = () => {
        setNotificationAnimation(true);
        // Play notification sound
        try {
          // Create a simple notification sound using Web Audio API
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
          oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
          
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.3);
        } catch (e) {
          console.log('Audio not supported, using animation only');
        }
        setTimeout(() => setNotificationAnimation(false), 1000);
      };
    }
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      // setUser(user); // This line was removed as per the edit hint
    });
    return unsubscribe;
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Fetch notifications for the logged-in user
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user && !recipesUser) {
        setNotifications([]);
        return;
      }
      setLoadingNotifications(true);
      try {
        const localNotifications = notificationService.getAll();
        setNotifications(localNotifications);
        console.log('Loaded local notifications:', localNotifications.length);
      } catch (err) {
        console.error('Error loading notifications:', err);
        setNotifications([]);
      } finally {
        setLoadingNotifications(false);
      }
    };
    fetchNotifications();
  }, [user, recipesUser]);

  // Listen for notification updates
  useEffect(() => {
    // Listen for notification updates
    const handleNotificationUpdate = () => {
      const localNotifications = JSON.parse(localStorage.getItem('smartchef_notifications') || '[]');
      setNotifications(localNotifications);
      console.log('Notifications updated:', localNotifications.length);
    };

    // Listen for custom events
    window.addEventListener('notificationsUpdated', handleNotificationUpdate);
    
    // Also listen for storage changes (for cross-tab updates)
    const handleStorageChange = (e) => {
      if (e.key === 'smartchef_notifications') {
        handleNotificationUpdate();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('notificationsUpdated', handleNotificationUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleClearNotifications = async () => {
    try {
      // Clear local notifications
      localStorage.removeItem('smartchef_notifications');
      setNotifications([]);
      console.log('Cleared all local notifications');
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  };

  const handleNotificationClick = (notification) => {
    if (notification.recipeId) {
      // Find the recipe and open it directly like carousel cards do
      const recipe = allRecipes?.find(r => r.id === notification.recipeId);
      
      if (recipe) {
        setShowNotifications(false);
        // Open the recipe card directly
        setSelectedRecipe(recipe);
        // Navigate to search page in background
        navigate('/search');
      }
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#23483b] px-4 sm:px-6 lg:px-10 py-3">
      <div className="flex items-center gap-4 sm:gap-6 lg:gap-8">
        <div className="flex items-center gap-2 sm:gap-4 text-white">
          <div className="size-3 sm:size-4">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M13.8261 30.5736C16.7203 29.8826 20.2244 29.4783 24 29.4783C27.7756 29.4783 31.2797 29.8826 34.1739 30.5736C36.9144 31.2278 39.9967 32.7669 41.3563 33.8352L24.8486 7.36089C24.4571 6.73303 23.5429 6.73303 23.1514 7.36089L6.64374 33.8352C8.00331 32.7669 11.0856 31.2278 13.8261 30.5736Z"
                fill="currentColor"
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M39.998 35.764C39.9944 35.7463 39.9875 35.7155 39.9748 35.6706C39.9436 35.5601 39.8949 35.4259 39.8346 35.2825C39.8168 35.2403 39.7989 35.1993 39.7813 35.1602C38.5103 34.2887 35.9788 33.0607 33.7095 32.5189C30.9875 31.8691 27.6413 31.4783 24 31.4783C20.3587 31.4783 17.0125 31.8691 14.2905 32.5189C12.0012 33.0654 9.44505 34.3104 8.18538 35.1832C8.17384 35.2075 8.16216 35.233 8.15052 35.2592C8.09919 35.3751 8.05721 35.4886 8.02977 35.589C8.00356 35.6848 8.00039 35.7333 8.00004 35.7388C8.00004 35.739 8 35.7393 8.00004 35.7388C8.00004 35.7641 8.0104 36.0767 8.68485 36.6314C9.34546 37.1746 10.4222 37.7531 11.9291 38.2772C14.9242 39.319 19.1919 40 24 40C28.8081 40 33.0758 39.319 36.0709 38.2772C37.5778 37.7531 38.6545 37.1746 39.3151 36.6314C39.9006 36.1499 39.9857 35.8511 39.998 35.764ZM4.95178 32.7688L21.4543 6.30267C22.6288 4.4191 25.3712 4.41909 26.5457 6.30267L43.0534 32.777C43.0709 32.8052 43.0878 32.8338 43.104 32.8629L41.3563 33.8352C43.104 32.8629 43.1038 32.8626 43.104 32.8629L43.1051 32.865L43.1065 32.8675L43.1101 32.8739L43.1199 32.8918C43.1276 32.906 43.1377 32.9246 43.1497 32.9473C43.1738 32.9925 43.2062 33.0545 43.244 33.1299C43.319 33.2792 43.4196 33.489 43.5217 33.7317C43.6901 34.1321 44 34.9311 44 35.7391C44 37.4427 43.003 38.7775 41.8558 39.7209C40.6947 40.6757 39.1354 41.4464 37.385 42.0552C33.8654 43.2794 29.133 44 24 44C18.867 44 14.1346 43.2794 10.615 42.0552C8.86463 41.4464 7.30529 40.6757 6.14419 39.7209C4.99695 38.7775 3.99999 37.4427 3.99999 35.7391C3.99999 34.8725 4.29264 34.0922 4.49321 33.6393C4.60375 33.3898 4.71348 33.1804 4.79687 33.0311C4.83898 32.9556 4.87547 32.8935 4.9035 32.8471C4.91754 32.8238 4.92954 32.8043 4.93916 32.7889L4.94662 32.777L4.95178 32.7688ZM35.9868 29.004L24 9.77997L12.0131 29.004C12.4661 28.8609 12.9179 28.7342 13.3617 28.6282C16.4281 27.8961 20.0901 27.4783 24 27.4783C27.9099 27.4783 31.5719 27.8961 34.6383 28.6282C35.082 28.7342 35.5339 28.8609 35.9868 29.004Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <h2 className="text-white text-sm sm:text-base lg:text-lg font-bold leading-tight tracking-[-0.015em]">SmartChef</h2>
        </div>
        <div className="hidden md:flex items-center gap-6 lg:gap-9">
          <Link 
            to="/dashboard" 
            className={`text-sm font-medium leading-normal ${isActive('/dashboard') ? 'text-white' : 'text-white/70 hover:text-white'}`}
          >
            Home
          </Link>
          <Link 
            to="/search" 
            className={`text-sm font-medium leading-normal ${isActive('/search') ? 'text-white' : 'text-white/70 hover:text-white'}`}
          >
            Browse
          </Link>
          <Link 
            to="/ai-search" 
            className={`text-sm font-medium leading-normal ${isActive('/ai-search') ? 'text-white' : 'text-white/70 hover:text-white'}`}
          >
            Generate
          </Link>
          <Link 
            to="/saved" 
            className={`text-sm font-medium leading-normal ${isActive('/saved') ? 'text-white' : 'text-white/70 hover:text-white'}`}
          >
            Saved
          </Link>
        </div>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-4 lg:gap-8">
        {/* Notification Button - Hidden on mobile */}
        <div className="relative hidden sm:flex">
          <button
            className={`max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-8 sm:h-10 bg-[#23483b] text-white gap-2 text-xs sm:text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-2 sm:px-2.5 relative transition-all duration-300 ${
              notificationAnimation ? 'animate-pulse scale-110 ring-2 ring-[#0b9766]' : ''
            }`}
            onClick={() => setShowNotifications((prev) => !prev)}
            aria-label="Show notifications"
          >
            <FiBell size={16} className={`sm:w-5 sm:h-5 ${notificationAnimation ? 'animate-bounce' : ''}`} />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#0b9766] rounded-full animate-pulse"></span>
            )}
          </button>
          {showNotifications && (
            <div
              ref={notificationsRef}
              className="absolute right-0 mt-2 w-72 bg-[#23483b] rounded-lg shadow-lg py-2 z-20 border border-[#326755] max-h-80 overflow-y-auto"
            >
              <div className="px-3 py-2 text-white font-semibold text-sm border-b border-[#326755] flex items-center justify-between">
                <span>Notifications</span>
                {notifications.length > 0 && (
                  <button
                    onClick={handleClearNotifications}
                    className="text-xs text-[#0b9766] hover:underline"
                  >
                    Clear All
                  </button>
                )}
              </div>
              {loadingNotifications ? (
                <div className="px-3 py-3 text-[#91cab6] text-sm">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="px-3 py-3 text-[#91cab6] text-sm">No notifications yet.</div>
              ) : (
                notifications.slice(0, 8).map((noti) => (
                  <div 
                    key={noti.id} 
                    className={`px-3 py-2 border-b border-[#326755] last:border-b-0 cursor-pointer hover:bg-[#19342a] transition-colors ${
                      noti.recipeId ? 'cursor-pointer' : 'cursor-default'
                    }`}
                    onClick={() => noti.recipeId && handleNotificationClick(noti)}
                  >
                    <div className="text-[#91cab6] text-xs mb-1 leading-relaxed">
                      {noti.message.length > 40 
                        ? `${noti.message.substring(0, 40)}...` 
                        : noti.message
                      }
                    </div>
                    <div className="text-xs text-[#91cab6] opacity-70">
                      {noti.timestamp ? new Date(noti.timestamp).toLocaleDateString() : ''}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        
        {/* Profile Avatar */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-8 sm:size-10 bg-gradient-to-br from-[#0b9766] to-[#059669] flex items-center justify-center"
          >
            {user?.photoURL ? (
              <img 
                src={user.photoURL} 
                alt="Profile" 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <FiUser className="text-white sm:w-5 sm:h-5" size={16} />
            )}
          </button>
          
          {showProfileDropdown && (
            <div className="absolute right-0 mt-2 w-40 sm:w-48 bg-[#23483b] rounded-lg shadow-lg py-1 z-10 border border-[#326755]">
              {user && (
                <Link
                  to="/profile"
                  className="block px-3 sm:px-4 py-2 text-sm text-white hover:bg-[#19342a]"
                >
                  My Profile
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 sm:px-4 py-2 text-sm text-white hover:bg-[#19342a] flex items-center"
              >
                <FiLogOut className="mr-2" /> Logout
              </button>
            </div>
          )}
        </div>
        
        {/* Mobile menu button */}
        <div className="relative md:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-white"
            aria-label="Open menu"
          >
            {isOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          </button>
          
          {/* Mobile Notifications Dropdown - FIXED: Now appears above menu with close button */}
          {showNotifications && (
            <div className="absolute right-0 bottom-full mb-2 w-72 bg-[#23483b] rounded-lg shadow-lg py-2 z-50 border border-[#326755] max-h-80 overflow-y-auto">
              <div className="px-3 py-2 text-white font-semibold text-sm border-b border-[#326755] flex items-center justify-between">
                <span>Notifications</span>
                <div className="flex items-center gap-2">
                  {notifications.length > 0 && (
                    <button
                      onClick={handleClearNotifications}
                      className="text-xs text-[#0b9766] hover:underline"
                    >
                      Clear All
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="text-[#91cab6] hover:text-white p-1"
                  >
                    <FiX size={14} />
                  </button>
                </div>
              </div>
              {loadingNotifications ? (
                <div className="px-3 py-3 text-[#91cab6] text-sm">Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="px-3 py-3 text-[#91cab6] text-sm">No notifications yet.</div>
              ) : (
                notifications.slice(0, 8).map((noti) => (
                  <div 
                    key={noti.id} 
                    className={`px-3 py-2 border-b border-[#326755] last:border-b-0 cursor-pointer hover:bg-[#19342a] transition-colors ${
                      noti.recipeId ? 'cursor-pointer' : 'cursor-default'
                    }`}
                    onClick={() => noti.recipeId && handleNotificationClick(noti)}
                  >
                    <div className="text-[#91cab6] text-xs mb-1 leading-relaxed">
                      {noti.message.length > 40 
                        ? `${noti.message.substring(0, 40)}...` 
                        : noti.message
                      }
                    </div>
                    <div className="text-xs text-[#91cab6] opacity-70">
                      {noti.timestamp ? new Date(noti.timestamp).toLocaleDateString() : ''}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
          
          {isOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-[#23483b] border border-[#326755] rounded-lg shadow-lg z-50">
              <div className="py-2">
                {/* Mobile Notification Button */}
                <div className="px-4 py-3 border-b border-[#326755]">
                  <button
                    onClick={() => setShowNotifications((prev) => !prev)}
                    className="flex items-center gap-2 text-sm font-medium text-white/70 hover:text-white w-full"
                  >
                    <FiBell size={16} />
                    <span>Notifications</span>
                    {notifications.length > 0 && (
                      <span className="w-2 h-2 bg-[#0b9766] rounded-full"></span>
                    )}
                  </button>
                </div>
                
                <Link
                  to="/dashboard"
                  className={`block px-4 py-3 text-sm font-medium ${isActive('/dashboard') ? 'text-white bg-[#19342a]' : 'text-white/70 hover:text-white hover:bg-[#19342a]'} rounded mx-2`}
                >
                  Home
                </Link>
                <Link
                  to="/search"
                  className={`block px-4 py-3 text-sm font-medium ${isActive('/search') ? 'text-white bg-[#19342a]' : 'text-white/70 hover:text-white hover:bg-[#19342a]'} rounded mx-2`}
                >
                  Browse
                </Link>
                <Link
                  to="/ai-search"
                  className={`block px-4 py-3 text-sm font-medium ${isActive('/ai-search') ? 'text-white bg-[#19342a]' : 'text-white/70 hover:text-white hover:bg-[#19342a]'} rounded mx-2`}
                >
                  Generate
                </Link>
                <Link
                  to="/saved"
                  className={`block px-4 py-3 text-sm font-medium ${isActive('/saved') ? 'text-white bg-[#19342a]' : 'text-white/70 hover:text-white hover:bg-[#19342a]'} rounded mx-2`}
                >
                  Saved
                </Link>
              </div>
              <div className="border-t border-[#326755] pt-2">
                {user && (
                  <Link
                    to="/profile"
                    className="block px-4 py-3 text-sm font-medium text-white/70 hover:text-white hover:bg-[#19342a] rounded mx-2"
                  >
                    My Profile
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 text-sm font-medium text-white/70 hover:text-white hover:bg-[#19342a] rounded mx-2 flex items-center"
                >
                  <FiLogOut className="mr-2" /> Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
