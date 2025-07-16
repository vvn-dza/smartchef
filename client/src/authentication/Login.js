import React, { useState } from 'react';
import { auth, googleProvider } from '../firebaseConfig';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';

const GOOGLE_ICON =
  "https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg";

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid email or password');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/dashboard');
    } catch (err) {
      setError('Google login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#11221c] px-4">
      <form
        onSubmit={handleLogin}
        className="bg-[#23483b] border border-[#326755] shadow-2xl rounded-2xl p-6 sm:p-8 w-full max-w-sm flex flex-col items-center space-y-5"
        autoComplete="off"
      >
        <h2 className="text-white text-xl sm:text-2xl font-bold mb-2">Login</h2>
        {error && <div className="text-red-400 text-sm text-center">{error}</div>}
        <input
          type="email"
          placeholder="Email"
          className="w-full px-4 py-3 sm:py-2 rounded-lg bg-[#19342a] border border-[#326755] text-white placeholder-[#91cab6] focus:outline-none focus:ring-2 focus:ring-[#0b9766] focus:border-[#0b9766] text-base transition"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full px-4 py-3 sm:py-2 rounded-lg bg-[#19342a] border border-[#326755] text-white placeholder-[#91cab6] focus:outline-none focus:ring-2 focus:ring-[#0b9766] focus:border-[#0b9766] text-base transition"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full py-3 sm:py-2 rounded-lg bg-[#0b9766] text-white font-semibold hover:bg-[#059669] transition-colors text-base"
        >
          Login
        </button>
        <div className="w-full flex items-center my-2">
          <div className="flex-grow border-t border-[#326755]" />
          <span className="mx-2 text-[#91cab6] text-xs">or</span>
          <div className="flex-grow border-t border-[#326755]" />
        </div>
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-2 py-3 sm:py-2 rounded-lg bg-white text-[#0b9766] font-semibold shadow hover:bg-gray-100 transition-colors text-base"
        >
          <img
            src={GOOGLE_ICON}
            alt="Google"
            className="w-5 h-5"
            onError={(e) => { e.target.src = GOOGLE_ICON; }}
          />
          Continue with Google
        </button>
        <p className="text-[#91cab6] text-xs mt-2 text-center">
          Don't have an account?{' '}
          <Link to="/signup" className="text-[#0b9766] hover:underline">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}