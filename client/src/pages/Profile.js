import { useState, useEffect, useRef } from 'react';
import { auth, db, storage } from '../firebaseConfig';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { updateProfile, deleteUser } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiEdit, FiSave, FiUpload, FiUser, FiMail, FiTrash2, FiX } from 'react-icons/fi';
import { fetchUserProfile, updateUserProfile, deleteUserProfile } from '../api/recipeService';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Profile() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    photoURL: ''
  });
  const [uploading, setUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (!user) {
        navigate('/login');
      }
      setCheckingAuth(false);
    });
    return unsubscribe;
  }, [navigate]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser) {
        navigate('/login');
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        let displayName = auth.currentUser.displayName || '';
        let email = auth.currentUser.email || '';
        if (userDoc.exists()) {
          const data = userDoc.data();
          displayName = data.displayName || displayName;
          email = data.email || email;
          setUserData(data);
        }
        setFormData({
          displayName,
          email,
          photoURL: auth.currentUser.photoURL || ''
        });
      } catch (err) {
        console.error("Error fetching user data:", err);
        showToast('Failed to load profile data', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate, showToast]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showToast('Please select a valid image file (JPEG, PNG, or WebP)', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      showToast('Image size must be less than 5MB', 'error');
      return;
    }

    try {
      setUploading(true);
      
      // Use the user's UID as the filename
      const storageRef = ref(storage, `profile_pictures/${auth.currentUser.uid}`);
      
      // Upload new image
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      // Update Firebase Auth profile
      await updateProfile(auth.currentUser, {
        photoURL: downloadURL
      });
      
      // Update Firestore user document
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userRef, {
        photoURL: downloadURL,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      // Update local state
      setFormData(prev => ({ ...prev, photoURL: downloadURL }));
      setUserData(prev => ({ ...prev, photoURL: downloadURL }));
      
      showToast('Profile picture updated successfully!', 'success');
    } catch (err) {
      console.error("Error uploading image:", err);
      showToast('Failed to upload image. Please try again.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      setUploading(true);
      
      // Remove from Firebase Auth
      await updateProfile(auth.currentUser, {
        photoURL: null
      });
      
      // Remove from Firestore
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userRef, {
        photoURL: null,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      // Try to delete from Storage
      try {
        const storageRef = ref(storage, `profile_pictures/${auth.currentUser.uid}`);
        await deleteObject(storageRef);
      } catch (storageErr) {
        console.log('Storage file not found, continuing...');
      }
      
      // Update local state
      setFormData(prev => ({ ...prev, photoURL: '' }));
      setUserData(prev => ({ ...prev, photoURL: '' }));
      
      showToast('Profile picture removed successfully!', 'success');
    } catch (err) {
      console.error("Error removing photo:", err);
      showToast('Failed to remove profile picture', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setUploading(true);
      
      // Update Firebase Auth
      await updateProfile(auth.currentUser, {
        displayName: formData.displayName
      });
      
      // Update Firestore
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userRef, {
        displayName: formData.displayName,
        email: formData.email,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      setUserData(prev => ({ ...prev, ...formData }));
      setEditMode(false);
      showToast('Profile updated successfully!', 'success');
    } catch (err) {
      console.error("Error updating profile:", err);
      showToast('Failed to update profile', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setUploading(true);
      
      // Delete user document from Firestore
      await deleteDoc(doc(db, 'users', auth.currentUser.uid));
      
      // Delete user from Firebase Auth
      await deleteUser(auth.currentUser);
      
      showToast('Account deleted successfully', 'success');
      navigate('/');
    } catch (err) {
      console.error("Error deleting account:", err);
      showToast('Failed to delete account', 'error');
    } finally {
      setUploading(false);
      setShowDeleteConfirm(false);
    }
  };

  if (checkingAuth || loading) {
    return (
      <div className="min-h-screen bg-[#11221c] flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading profile..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#11221c] text-white">
      {/* Header */}
      <div className="bg-[#23483b] border-b border-[#326755]">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="text-[#91cab6] hover:text-white transition-colors"
            >
              <FiArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold text-white">Profile</h1>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 sm:py-10">
        <div className="bg-[#23483b] rounded-lg shadow-lg overflow-hidden border border-[#326755]">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-[#0b9766] to-[#059669] p-6 sm:p-8 text-center relative">
            <div className="absolute top-4 sm:top-5 right-4 sm:right-5 flex gap-2">
              <button 
                onClick={() => setEditMode(!editMode)}
                className="bg-[#23483b] p-2 rounded-full shadow-lg hover:bg-[#326755] border border-[#326755] transition-colors duration-150 relative group"
                title={editMode ? 'Save' : 'Edit'}
              >
                {editMode ? <FiSave size={18} className="text-[#91cab6]" /> : <FiEdit size={18} className="text-[#91cab6]" />}
                <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-xs text-[#91cab6] opacity-0 group-hover:opacity-100 transition-opacity">{editMode ? 'Save' : 'Edit'}</span>
              </button>
            </div>
            
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 mx-auto">
              {formData.photoURL ? (
                <img
                  src={formData.photoURL}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover border-4 border-[#23483b] shadow-lg bg-[#19342a]"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/default-profile.png';
                  }}
                />
              ) : (
                <div className="w-full h-full rounded-full border-4 border-[#23483b] shadow-lg bg-[#19342a] flex items-center justify-center">
                  <FiUser className="w-12 h-12 text-[#91cab6]" />
                </div>
              )}
            </div>
            
            <h1 className="text-xl sm:text-2xl font-bold text-white mt-4 sm:mt-5 drop-shadow-sm">
              {formData.displayName || 'User'}
            </h1>
            <p className="text-[#91cab6] text-sm mt-1">{formData.email}</p>
          </div>

          {/* Profile Content */}
          <div className="p-6 sm:p-7 lg:p-8">
            {editMode ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[#91cab6] mb-1 flex items-center">
                    <FiUser className="mr-2 text-[#0b9766]" /> Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.displayName}
                      onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                      className="w-full rounded-lg border border-[#326755] shadow-sm focus:border-[#0b9766] focus:ring-2 focus:ring-[#0b9766] bg-[#19342a] text-white placeholder-[#91cab6] pl-10 py-2 transition-all"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#91cab6] mb-1 flex items-center">
                    <FiMail className="mr-2 text-[#0b9766]" /> Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full rounded-lg border border-[#326755] shadow-sm bg-[#19342a] text-white pl-10 py-2 opacity-50 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#91cab6] mb-1 flex items-center">
                    <FiUpload className="mr-2 text-[#0b9766]" /> Profile Picture
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#19342a] border border-[#326755] text-white hover:bg-[#23483b] transition-colors text-sm disabled:opacity-50"
                    >
                      {uploading ? (
                        <LoadingSpinner size="sm" text="" />
                      ) : (
                        <FiUpload size={16} />
                      )}
                      Upload Photo
                    </button>
                    {formData.photoURL && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        disabled={uploading}
                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors text-sm disabled:opacity-50"
                      >
                        <FiTrash2 size={16} />
                        Remove
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 bg-[#0b9766] text-white py-2 px-4 rounded-lg hover:bg-[#059669] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    {uploading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="flex-1 bg-[#23483b] text-white py-2 px-4 rounded-lg hover:bg-[#19342a] transition-colors text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[#91cab6] mb-1 flex items-center">
                    <FiUser className="mr-2 text-[#0b9766]" /> Name
                  </label>
                  <p className="text-white text-sm sm:text-base">{formData.displayName || 'Not set'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#91cab6] mb-1 flex items-center">
                    <FiMail className="mr-2 text-[#0b9766]" /> Email
                  </label>
                  <p className="text-white text-sm sm:text-base">{formData.email}</p>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => setEditMode(true)}
                    className="w-full bg-[#0b9766] text-white py-2 px-4 rounded-lg hover:bg-[#059669] transition-colors text-sm sm:text-base"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            )}

            {/* Delete Account Section */}
            <div className="mt-8 pt-6 border-t border-[#326755]">
              <h3 className="text-white font-semibold mb-3 text-sm sm:text-base">Danger Zone</h3>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
            <div className="bg-[#23483b] rounded-lg p-6 max-w-md w-full">
              <h3 className="text-white font-bold mb-4">Delete Account</h3>
              <p className="text-[#91cab6] mb-6 text-sm sm:text-base">
                Are you sure you want to delete your account? This action cannot be undone.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={uploading}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base disabled:opacity-50"
                >
                  {uploading ? 'Deleting...' : 'Delete Account'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-[#23483b] text-white py-2 px-4 rounded-lg hover:bg-[#19342a] transition-colors text-sm sm:text-base"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}