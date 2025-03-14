// src/Home.js
import React from 'react';
import { auth } from './firebase';
import { signOut } from 'firebase/auth';

const Home = () => {
  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        console.log("User signed out successfully.");
      })
      .catch((error) => {
        console.error("Error signing out:", error);
      });
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h1>Home - Protected Content</h1>
      <p>This page is only visible to logged in users.</p>
      <button onClick={handleLogout} style={{ padding: '0.5rem 1rem', marginTop: '1rem' }}>
        Logout
      </button>
    </div>
  );
};

export default Home;
