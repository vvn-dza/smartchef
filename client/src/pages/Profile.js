import { useState, useEffect, useRef } from 'react';
import { auth, db, storage } from '../firebaseConfig';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { updateProfile, deleteUser } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useToast } from '../context/ToastContext';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiEdit, FiSave, FiUpload, FiUser, FiMail, FiTrash2, FiX } from 'react-icons/fi';

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

  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser) {
        navigate('/login');
        return;
      }
      
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
          setFormData({
            displayName: userDoc.data().displayName || auth.currentUser.displayName || '',
            email: auth.currentUser.email || '',
            photoURL: userDoc.data().photoURL || auth.currentUser.photoURL || ''
          });
        }
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

    try {
      setUploading(true);
      const storageRef = ref(storage, `profile_pictures/${auth.currentUser.uid}`);
      
      // Upload new image
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      // Update local state
      setFormData(prev => ({ ...prev, photoURL: downloadURL }));
      showToast('Profile picture updated!', 'success');
    } catch (err) {
      console.error("Error uploading image:", err);
      showToast('Failed to upload image', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    try {
      setUploading(true);
      // Delete from storage
      const storageRef = ref(storage, `profile_pictures/${auth.currentUser.uid}`);
      await deleteObject(storageRef).catch(() => {});
      
      // Update local state
      setFormData(prev => ({ ...prev, photoURL: '' }));
      showToast('Profile picture removed', 'success');
    } catch (err) {
      console.error("Error removing photo:", err);
      showToast('Failed to remove photo', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Update auth profile
      await updateProfile(auth.currentUser, {
        displayName: formData.displayName,
        photoURL: formData.photoURL || null
      });
      
      // Update Firestore
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        displayName: formData.displayName,
        photoURL: formData.photoURL || null,
        email: auth.currentUser.email,
        lastUpdated: new Date()
      }, { merge: true });
      
      showToast('Profile updated successfully!', 'success');
      setEditMode(false);
    } catch (err) {
      console.error("Error updating profile:", err);
      showToast('Failed to update profile', 'error');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      // Delete profile picture from storage if exists
      if (auth.currentUser.photoURL) {
        const storageRef = ref(storage, `profile_pictures/${auth.currentUser.uid}`);
        await deleteObject(storageRef).catch(() => {});
      }

      // Delete user data from Firestore
      await deleteDoc(doc(db, 'users', auth.currentUser.uid));

      // Delete user account
      await deleteUser(auth.currentUser);

      showToast('Account deleted successfully', 'success');
      navigate('/');
    } catch (err) {
      console.error("Error deleting account:", err);
      showToast('Failed to delete account', 'error');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
    </div>
  );

  return (
    <div className="max-w-md mx-auto px-4 py-8">
      {/* Back Button */}
      <button 
        onClick={() => navigate('/dashboard')} 
        className="flex items-center text-gray-600 hover:text-blue-600 mb-6"
      >
        <FiArrowLeft className="mr-2" /> Back to Dashboard
      </button>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-center relative">
          <div className="absolute top-4 right-4 flex gap-2">
            <button 
              onClick={() => setEditMode(!editMode)}
              className="bg-white p-2 rounded-full shadow-md hover:bg-gray-100"
            >
              {editMode ? <FiSave size={18} /> : <FiEdit size={18} />}
            </button>
          </div>
          
          <div className="relative w-32 h-32 mx-auto">
            <img
              src={formData.photoURL || '/default-profile.png'}
              alt="Profile"
              className="w-full h-full rounded-full object-cover border-4 border-white shadow-md"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/default-profile.png';
              }}
            />
            {editMode && (
              <div className="absolute bottom-0 right-0 flex gap-2">
                {formData.photoURL && (
                  <button
                    onClick={handleRemovePhoto}
                    className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                    title="Remove photo"
                  >
                    <FiX size={16} />
                  </button>
                )}
                <label className="bg-blue-500 text-white p-2 rounded-full cursor-pointer hover:bg-blue-600">
                  <FiUpload size={16} />
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    className="hidden"
                    accept="image/*"
                  />
                </label>
              </div>
            )}
          </div>
          
          <h1 className="text-2xl font-bold text-white mt-4">
            {formData.displayName || 'User'}
          </h1>
          <p className="text-blue-100">{formData.email}</p>
        </div>

        {/* Profile Content */}
        <div className="p-6">
          {editMode ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <FiUser className="mr-2" /> Name
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                  <FiMail className="mr-2" /> Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full rounded-md border-gray-300 shadow-sm bg-gray-100"
                />
              </div>
              
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  {uploading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Account Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-600">
                    <span className="font-medium">Name:</span> {formData.displayName}
                  </p>
                  <p className="text-gray-600 mt-2">
                    <span className="font-medium">Email:</span> {formData.email}
                  </p>
                  <p className="text-gray-600 mt-2">
                    <span className="font-medium">Joined:</span> {new Date(userData?.createdAt?.seconds * 1000).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100"
                >
                  <FiTrash2 /> Delete Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-4">Confirm Account Deletion</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
              >
                <FiTrash2 /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}