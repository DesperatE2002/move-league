'use client';

import { useState, useEffect } from 'react';
import { useUser, SignedIn, SignedOut } from '@clerk/nextjs';
import ClerkLoginPage from '../components/ClerkLoginPage';
import ProfileCompletionPage from '../components/ProfileCompletionPage';
import PendingApprovalPage from '../components/PendingApprovalPage';
import HomePage from '../components/HomePage';

export default function Home() {
  const { user: clerkUser, isLoaded } = useUser();
  const [appUser, setAppUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFirstLogin, setIsFirstLogin] = useState(false);

  useEffect(() => {
    if (isLoaded && clerkUser) {
      checkUser();
    } else if (isLoaded && !clerkUser) {
      setLoading(false);
    }
  }, [isLoaded, clerkUser]);

  const checkUser = async () => {
    try {
      const response = await fetch('/api/auth/check-user');
      const data = await response.json();

      if (data.success) {
        if (data.data.isFirstLogin) {
          setIsFirstLogin(true);
        } else {
          setAppUser(data.data.user);
        }
      }
    } catch (error) {
      console.error('Check user error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileComplete = (user) => {
    setAppUser(user);
    setIsFirstLogin(false);
  };

  // Loading state
  if (!isLoaded || loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#000',
        color: '#fff'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '3px solid rgba(255,59,48,0.3)',
            borderTop: '3px solid #FF3B30',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }} />
          <p>Yükleniyor...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <SignedIn>
        {isFirstLogin ? (
          <ProfileCompletionPage 
            clerkUser={{
              email: clerkUser?.emailAddresses[0]?.emailAddress,
              name: `${clerkUser?.firstName || ''} ${clerkUser?.lastName || ''}`.trim(),
              avatar: clerkUser?.imageUrl,
            }}
            onComplete={handleProfileComplete}
          />
        ) : appUser && !appUser.isApproved ? (
          <PendingApprovalPage user={appUser} />
        ) : appUser ? (
          <HomePage user={appUser.name?.split(' ')[0] || appUser.email?.split('@')[0] || 'User'} />
        ) : null}
      </SignedIn>
      <SignedOut>
        <ClerkLoginPage />
      </SignedOut>
    </>
  );
}
