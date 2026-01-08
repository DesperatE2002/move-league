"use client";

import { useEffect } from 'react';
import { AuthenticateWithRedirectCallback } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function SSOCallback() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#000',
      color: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif'
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
        <h2>Giriş yapılıyor...</h2>
        <p style={{ color: '#9aa0a6' }}>Lütfen bekleyin</p>
        <AuthenticateWithRedirectCallback />
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
