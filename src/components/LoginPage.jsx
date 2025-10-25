"use client";

import React, { useState } from 'react';
import { authApi } from '@/lib/api-client';

/**
 * LoginPage.jsx
 * Real login page for "Move League" with API integration
 */

const LoginPage = ({ onLogin, onSignupClick }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
            <p className="subtitle">Adana's First Digital Dance Battle Arena</p>
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
