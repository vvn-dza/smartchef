import { useState, useEffect } from 'react';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { useToast } from '../context/ToastContext';

export default function Profile() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    photoURL: ''
  });
  const { showToast } = useToast();

  useEffect(() => {
    const fetchUserData = async () => {
      if (!auth.currentUser) return;
      
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
  }, [showToast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Update auth profile
      await updateProfile(auth.currentUser, {
        displayName: formData.displayName,
        photoURL: formData.photoURL
      });
      
      // Update Firestore with additional user data
      await setDoc(doc(db, 'users', auth.currentUser.uid), {
        displayName: formData.displayName,
        photoURL: formData.photoURL,
        email: auth.currentUser.email,
        lastUpdated: new Date()
      }, { merge: true });
      
      showToast('Profile updated successfully!', 'success');
    } catch (err) {
      console.error("Error updating profile:", err);
      showToast('Failed to update profile', 'error');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Your Profile</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            value={formData.displayName}
            onChange={(e) => setFormData({...formData, displayName: e.target.value})}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={formData.email}
            disabled
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Profile Photo URL</label>
          <input
            type="url"
            value={formData.photoURL}
            onChange={(e) => setFormData({...formData, photoURL: e.target.value})}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="https://example.com/photo.jpg"
          />
        </div>
        
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Update Profile
        </button>
      </form>
    </div>
  );
}