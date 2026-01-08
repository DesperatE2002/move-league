"use client";

import { SignIn } from '@clerk/nextjs';

/**
 * ClerkLoginPage.jsx
 * Clerk's pre-built sign-in component
 */
const ClerkLoginPage = () => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0b0b0b 0%, #1a0000 100%)',
      padding: '2rem',
    }}>
      <SignIn 
        appearance={{
          elements: {
            rootBox: {
              boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
            },
            card: {
              background: 'linear-gradient(135deg, rgba(30,30,30,0.98) 0%, rgba(50,10,10,0.95) 100%)',
              border: '1px solid rgba(255,255,255,0.08)',
            }
          }
        }}
      />
    </div>
  );
};

export default ClerkLoginPage;
