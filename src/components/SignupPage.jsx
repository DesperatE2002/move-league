"use client";

import React, { useState } from 'react';
import { authApi } from '@/lib/api-client';

/**
 * SignupPage.jsx
 * Registration page for "Move League" with API integration
 */

const SignupPage = ({ onSignup, onBackToLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'dancer',
    danceStyles: [],
    studioName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const danceStyleOptions = [
    'Salsa', 'Bachata', 'Kizomba', 'Zouk', 'Tango', 
    'Hip Hop', 'Contemporary', 'Breaking', 'House', 'Waacking'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDanceStyleToggle = (style) => {
    setFormData(prev => ({
      ...prev,
      danceStyles: prev.danceStyles.includes(style)
        ? prev.danceStyles.filter(s => s !== style)
        : [...prev.danceStyles, style]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Şifreler eşleşmiyor!');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır!');
      setLoading(false);
      return;
    }

    if ((formData.role === 'dancer' || formData.role === 'instructor') && formData.danceStyles.length === 0) {
      setError('En az bir dans stili seçmelisiniz!');
      setLoading(false);
      return;
    }

    if (formData.role === 'studio' && !formData.studioName.trim()) {
      setError('Stüdyo adı gereklidir!');
      setLoading(false);
      return;
    }

    try {
      console.log('📝 Signup attempt:', formData.email, formData.role);
      
      const payload = {
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: formData.role,
        danceStyles: formData.danceStyles,
        ...(formData.role === 'studio' && { studioName: formData.studioName })
      };

      const response = await authApi.register(payload);
      console.log('✅ Signup response:', response);
      
      if (response.success && onSignup) {
        // Auto login after signup
        const loginResponse = await authApi.login(formData.email, formData.password);
        if (loginResponse.success) {
          onSignup(loginResponse.data.user.email);
        }
      }
    } catch (err) {
      console.error('❌ Signup error:', err);
      setError(err.message || 'Kayıt başarısız. Lütfen bilgilerinizi kontrol edin.');
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
            <p className="subtitle">Hemen Kayıt Ol, Dans Et!</p>
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
            <input 
              className="input" 
              type="text" 
              name="name"
              placeholder="Ad Soyad" 
              value={formData.name}
              onChange={handleInputChange}
              required 
            />

            <input 
              className="input" 
              type="email" 
              name="email"
              placeholder="Email" 
              value={formData.email}
              onChange={handleInputChange}
              required 
            />

            <input 
              className="input" 
              type="password" 
              name="password"
              placeholder="Şifre (min 6 karakter)" 
              value={formData.password}
              onChange={handleInputChange}
              required 
            />

            <input 
              className="input" 
              type="password" 
              name="confirmPassword"
              placeholder="Şifre Tekrar" 
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required 
            />

            <div className="role-selector">
              <label className="role-label">Rol Seçin:</label>
              <div className="role-options">
                <label className={`role-option ${formData.role === 'dancer' ? 'selected' : ''}`}>
                  <input 
                    type="radio" 
                    name="role" 
                    value="dancer"
                    checked={formData.role === 'dancer'}
                    onChange={handleInputChange}
                  />
                  <span>💃 Dansçı</span>
                </label>
                <label className={`role-option ${formData.role === 'instructor' ? 'selected' : ''}`}>
                  <input 
                    type="radio" 
                    name="role" 
                    value="instructor"
                    checked={formData.role === 'instructor'}
                    onChange={handleInputChange}
                  />
                  <span>👨‍🏫 Eğitmen</span>
                </label>
                <label className={`role-option ${formData.role === 'studio' ? 'selected' : ''}`}>
                  <input 
                    type="radio" 
                    name="role" 
                    value="studio"
                    checked={formData.role === 'studio'}
                    onChange={handleInputChange}
                  />
                  <span>🏢 Stüdyo</span>
                </label>
              </div>
            </div>

            {(formData.role === 'dancer' || formData.role === 'instructor') && (
              <div className="dance-styles">
                <label className="dance-label">Dans Stilleri:</label>
                <div className="dance-grid">
                  {danceStyleOptions.map(style => (
                    <button
                      key={style}
                      type="button"
                      className={`dance-tag ${formData.danceStyles.includes(style) ? 'selected' : ''}`}
                      onClick={() => handleDanceStyleToggle(style)}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {formData.role === 'studio' && (
              <input 
                className="input" 
                type="text" 
                name="studioName"
                placeholder="Stüdyo Adı" 
                value={formData.studioName}
                onChange={handleInputChange}
                required 
              />
            )}

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Kayıt yapılıyor...' : '✨ Kayıt Ol'}
            </button>

            <button 
              type="button" 
              className="btn btn-outline" 
              onClick={onBackToLogin}
            >
              ← Giriş Sayfasına Dön
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

        /* Faint background image */
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
          max-width:480px;
        }

        .card{
          background: linear-gradient(135deg, rgba(30,30,30,0.98) 0%, rgba(50,10,10,0.95) 100%);
          border-radius:16px;
          padding:2rem;
          box-shadow: 0 20px 60px rgba(0,0,0,0.8), 0 0 80px rgba(255,59,48,0.15) inset;
          border:1px solid rgba(255,255,255,0.08);
          backdrop-filter: blur(10px);
          max-height: 90vh;
          overflow-y: auto;
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

        /* Role Selector */
        .role-selector{
          margin: 0.5rem 0;
        }

        .role-label{
          display: block;
          font-size: 0.9rem;
          color: #e0e0e0;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        .role-options{
          display: flex;
          gap: 0.5rem;
        }

        .role-option{
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.75rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .role-option input{
          display: none;
        }

        .role-option span{
          font-size: 0.85rem;
          color: #e0e0e0;
        }

        .role-option.selected{
          background: rgba(255,59,48,0.2);
          border-color: #FF3B30;
        }

        .role-option:hover{
          background: rgba(255,255,255,0.1);
        }

        /* Dance Styles */
        .dance-styles{
          margin: 0.5rem 0;
        }

        .dance-label{
          display: block;
          font-size: 0.9rem;
          color: #e0e0e0;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        .dance-grid{
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.5rem;
        }

        .dance-tag{
          padding: 0.6rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 6px;
          color: #e0e0e0;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .dance-tag.selected{
          background: rgba(255,59,48,0.2);
          border-color: #FF3B30;
          color: #fff;
        }

        .dance-tag:hover{
          background: rgba(255,255,255,0.1);
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
        .btn:disabled{ opacity: 0.6; cursor: not-allowed; }

        .btn-primary{
          background: linear-gradient(90deg, #FF3B30, #d42b20 80%);
          color: white;
          font-size:1rem;
          box-shadow: 0 10px 35px rgba(255,59,48,0.25);
        }

        .btn-primary:hover:not(:disabled){ 
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
          .role-options{ flex-direction: column; }
          .dance-grid{ grid-template-columns: 1fr; }
        }

      `}</style>
    </div>
  );
};

export default SignupPage;
