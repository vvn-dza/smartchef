// src/pages/Login.js
import React, { useState } from 'react';
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert('Logged in!');
    } catch (error) {
      alert('Login failed:', error.message);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert('Account created!');
    } catch (error) {
      alert('Signup failed:', error.message);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Login to SmartChef</h2>
      <form>
        <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} /><br />
        <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} /><br />
        <button onClick={handleLogin}>Login</button>
        <button onClick={handleRegister}>Register</button>
      </form>
    </div>
  );
}

export default Login;