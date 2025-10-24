'use client';

import { useState } from 'react';
import LoginPage from '../components/LoginPage';
import SignupPage from '../components/SignupPage';
import HomePage from '../components/HomePage';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const handleLogin = (email: string) => {
    setUserEmail(email);
    setIsLoggedIn(true);
  };

  const handleSignup = (email: string) => {
    setUserEmail(email);
    setIsLoggedIn(true);
  };

  const handleShowSignup = () => {
    setShowSignup(true);
  };

  const handleBackToLogin = () => {
    setShowSignup(false);
  };

  if (isLoggedIn) {
    return <HomePage user={userEmail.split('@')[0]} />;
  }

  if (showSignup) {
    return <SignupPage onSignup={handleSignup} onBackToLogin={handleBackToLogin} />;
  }

  return <LoginPage onLogin={handleLogin} onSignupClick={handleShowSignup} />;
}
