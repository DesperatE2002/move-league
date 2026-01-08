'use client';

import { useUser, SignedIn, SignedOut } from '@clerk/nextjs';
import ClerkLoginPage from '../components/ClerkLoginPage';
import HomePage from '../components/HomePage';

export default function Home() {
  const { user, isLoaded } = useUser();

  // Loading state
  if (!isLoaded) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#000',
        color: '#fff'
      }}>
        <div style={{
          textAlign: 'center'
        }}>
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
        <HomePage user={user?.firstName || user?.emailAddresses[0]?.emailAddress?.split('@')[0] || 'User'} />
      </SignedIn>
      <SignedOut>
        <ClerkLoginPage />
      </SignedOut>
    </>
  );
}
