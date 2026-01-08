"use client";

import React, { useState } from 'react';
import { authApi } from '@/lib/api-client';
import ForgotPasswordPage from './ForgotPasswordPage';

/**
 * LoginPage.jsx
 * Real login page for "Move League" with API integration
 */

const LoginPage = ({ onLogin, onSignupClick }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('🔐 Login attempt:', email);
      const response = await authApi.login(email, password);
      console.log('✅ Login response:', response);
      
      if (response.success && onLogin) {
        // onLogin email string bekliyor (page.tsx'de)
        onLogin(response.data.user.email);
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      setError(err.message || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    alert('🚧 Google ile giriş özelliği yakında eklenecek!');
  };

  // Eğer "Şifremi Unuttum" sayfası gösterilecekse
  if (showForgotPassword) {
    return <ForgotPasswordPage onBackToLogin={() => setShowForgotPassword(false)} />;
  }

  return (
    <div className="page-root">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap" rel="stylesheet" />

      <div className="bg-image" aria-hidden="true" />

      <main className="container">
        <div className="card animate-fade">
          <header className="card-header">
            <h1 className="logo">Move League</h1>
            <p className="subtitle">The Digital Dance Battle Arena</p>
          </header>

          {error && (
            <div style={{
              padding: '1rem',
              background: '#fecaca',
              color: '#991b1b',
              borderRadius: '8px',
              marginBottom: '1rem'
            }}>
              ⚠️ {error}
            </div>
          )}

          <form className="form" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="email">Email address</label>
            <input 
              id="email" 
              className="input" 
              type="email" 
              placeholder="Email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />

            <label className="sr-only" htmlFor="password">Password</label>
            <input 
              id="password" 
              className="input" 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Giriş yapılıyor...' : 'Login'}
            </button>

            {/* Social Login Buttons */}
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              marginTop: '1rem'
            }}>
              <button 
                type="button" 
                className="btn btn-social"
                onClick={handleGoogleLogin}
                disabled={loading}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(66, 133, 244, 0.1)';
                  e.target.style.borderColor = 'rgba(66, 133, 244, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255,255,255,0.05)';
                  e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </button>

              <button 
                type="button" 
                className="btn btn-social"
                onClick={() => alert('🍎 Apple ile giriş yakında aktif olacak!')}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'all 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(255,255,255,0.1)';
                  e.target.style.borderColor = 'rgba(255,255,255,0.2)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(255,255,255,0.05)';
                  e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Apple
              </button>
            </div>

            <button 
              type="button" 
              className="btn btn-link"
              onClick={() => setShowForgotPassword(true)}
            >
              🔐 Şifremi Unuttum
            </button>

            <button 
              type="button" 
              className="btn btn-outline" 
              onClick={onSignupClick}
            >
              ✨ Hesap Oluştur
            </button>
          </form>

          <footer className="card-footer">© 2025 Move League — Powered by Berkay Şimşek</footer>
        </div>
      </main>

      <style jsx>{`
        /* Variables */
        :root{
          --bg:#0b0b0b;
          --deep-red:#2a0000;
          --accent:#FF3B30;
          --muted: #9aa0a6;
          --card-bg: linear-gradient(135deg, rgba(20,20,20,0.95) 0%, rgba(34,6,6,0.85) 100%);
          --glass: rgba(255,255,255,0.03);
        }

        /* Page root */
        .page-root{
          font-family: 'Poppins', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
          min-height:100vh;
          background: #000000;
          color: #fff;
          display:flex;
          align-items:center;
          justify-content:center;
          padding:2rem;
          position:relative;
          overflow:hidden;
        }

        /* Faint background image (Unsplash placeholder, free to hotlink for demo) */
        .bg-image{
          position:absolute;
          inset:0;
          background-image: url('https://images.unsplash.com/photo-1519677100203-a0e668c92439?q=80&w=1600&auto=format&fit=crop&ixlib=rb-4.0.3&s=placeholder');
          background-size:cover;
          background-position:center;
          opacity:0.06;
          filter:grayscale(20%) contrast(80%);
          z-index:0;
        }

        /* Container & card */
        .container{
          z-index:10;
          width:100%;
          max-width:420px;
        }

        .card{
          background: linear-gradient(135deg, rgba(30,30,30,0.98) 0%, rgba(50,10,10,0.95) 100%);
          border-radius:16px;
          padding:2rem;
          box-shadow: 0 20px 60px rgba(0,0,0,0.8), 0 0 80px rgba(255,59,48,0.15) inset;
          border:1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(10px);
        }

        .animate-fade{
          animation: fadeUp .7s ease both;
        }

        @keyframes fadeUp{
          from{ opacity:0; transform: translateY(18px) scale(0.995); }
          to{ opacity:1; transform: translateY(0) scale(1); }
        }

        /* Header */
        .card-header{
          text-align:center;
          margin-bottom:1.25rem;
        }

        .logo{
          margin:0;
          font-size:2rem;
          font-weight:700;
          color:#fff;
          text-shadow: 0 4px 20px rgba(255,59,48,0.4), 0 0 15px rgba(255,59,48,0.2);
          letter-spacing:0.5px;
        }

        .subtitle{
          margin:0.4rem 0 0;
          font-size:0.9rem;
          color:#b0b0b0;
          font-weight:300;
        }

        /* Form */
        .form{
          display:flex;
          flex-direction:column;
          gap:0.75rem;
        }

        .input{
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.15);
          padding:0.9rem 1rem;
          border-radius:10px;
          color:#fff;
          font-size:0.95rem;
          outline:none;
          transition: box-shadow .18s ease, transform .12s ease, border-color .2s ease;
        }

        .input::placeholder{ color: rgba(255,255,255,0.5); }
        .input:focus{ 
          box-shadow: 0 6px 20px rgba(255,59,48,0.15); 
          transform: translateY(-1px); 
          border-color: rgba(255,59,48,0.4);
        }

        /* Buttons */
        .btn{
          display:inline-flex;
          align-items:center;
          justify-content:center;
          gap:0.6rem;
          padding:0.9rem 1rem;
          border-radius:10px;
          font-weight:600;
          cursor:pointer;
          border:none;
          transition: transform .12s ease, box-shadow .15s ease, opacity .12s;
        }

        .btn:active{ transform: translateY(1px) scale(.997); }

        .btn-primary{
          background: linear-gradient(90deg, #FF3B30, #d42b20 80%);
          color: white;
          font-size:1rem;
          box-shadow: 0 10px 35px rgba(255,59,48,0.25);
        }

        .btn-primary:hover{ 
          box-shadow: 0 12px 40px rgba(255,59,48,0.35);
          background: linear-gradient(90deg, #ff4f45, #e03528 80%);
        }

        .btn-outline{
          background: transparent;
          color: #fff;
          border:1px solid rgba(255,255,255,0.25);
        }

        .btn-outline:hover{ 
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.35);
        }

        .btn-link{
          background: transparent;
          color: #999;
          border: none;
          font-size: 0.9rem;
          text-decoration: none;
          padding: 0.5rem;
        }

        .btn-link:hover{
          color: #FF3B30;
          text-decoration: underline;
        }

        .btn-google{
          background: rgba(255,255,255,0.06);
          color:#fff;
          border:1px solid rgba(255,255,255,0.15);
          padding:0.7rem 0.8rem;
        }
        
        .btn-google:hover{
          background: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.25);
        }

        .google-icon{ width:18px; height:18px; margin-right:8px; }

        .row{
          display:flex;
          gap:0.6rem;
          align-items:center;
          justify-content:space-between;
        }

        .card-footer{
          margin-top:1.25rem;
          text-align:center;
          font-size:0.78rem;
          color:#9aa0a6;
        }

        /* Accessibility helpers */
        .sr-only{
          position:absolute;
          width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;
        }

        /* Responsive */
        @media (max-width:520px){
          .card{ padding:1.5rem; border-radius:14px; }
          .logo{ font-size:1.4rem; }
          .row{ flex-direction:column-reverse; }
          .btn-google{ width:100%; justify-content:center; }
          .btn-outline{ width:100%; }
        }

      `}</style>
    </div>
  );
};

export default LoginPage;

/*
  End of file: LoginPage.jsx
  Note: This is a static demo component. Replace alert handlers with real auth logic when ready.
*/
