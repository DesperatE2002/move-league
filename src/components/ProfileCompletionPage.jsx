"use client";

import React, { useState } from 'react';

const ProfileCompletionPage = ({ clerkUser, onComplete }) => {
  const [role, setRole] = useState('DANCER');
  const [danceStyles, setDanceStyles] = useState([]);
  const [gender, setGender] = useState('');
  const [phone, setPhone] = useState('');
  const [experience, setExperience] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const availableDanceStyles = [
    'HİPHOP', 'BREAKING', 'POPPING', 'LOCKING', 
    'HOUSE', 'KRUMP', 'WAACKING', 'VOGUEING', 
    'SALSA', 'BACHATA', 'KIZOMBA'
  ];

  const toggleDanceStyle = (style) => {
    if (danceStyles.includes(style)) {
      setDanceStyles(danceStyles.filter(s => s !== style));
    } else {
      setDanceStyles([...danceStyles, style]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (danceStyles.length === 0) {
      setError('Lütfen en az bir dans türü seçin');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          danceStyles,
          gender,
          phone,
          experience: experience || null,
          bio,
        }),
      });

      const data = await response.json();

      if (data.success) {
        onComplete(data.data.user);
      } else {
        setError(data.message || 'Profil tamamlanamadı');
      }
    } catch (err) {
      console.error('Profile completion error:', err);
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0b0b0b 0%, #1a0000 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(30,30,30,0.98) 0%, rgba(50,10,10,0.95) 100%)',
        borderRadius: '16px',
        padding: '2rem',
        maxWidth: '600px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <h2 style={{ color: '#fff', marginBottom: '0.5rem', fontSize: '1.75rem' }}>
          Hoş Geldin! 🎉
        </h2>
        <p style={{ color: '#9aa0a6', marginBottom: '2rem' }}>
          {clerkUser.name || clerkUser.email}, profil bilgilerini tamamla
        </p>

        {error && (
          <div style={{
            background: 'rgba(255,59,48,0.1)',
            border: '1px solid rgba(255,59,48,0.3)',
            borderRadius: '8px',
            padding: '0.75rem',
            marginBottom: '1rem',
            color: '#FF3B30'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Role Selection */}
          <label style={{ color: '#fff', display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
            Rol Seçin *
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '0.75rem',
              marginBottom: '1rem',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px'
            }}
          >
            <option value="DANCER">🕺 Dansçı</option>
            <option value="INSTRUCTOR">👨‍🏫 Eğitmen (Onay Gerekir)</option>
            <option value="REFEREE">⚖️ Hakem (Onay Gerekir)</option>
            <option value="STUDIO">🏢 Stüdyo Sahibi</option>
          </select>

          {(role === 'INSTRUCTOR' || role === 'REFEREE') && (
            <div style={{
              background: 'rgba(255,165,0,0.1)',
              border: '1px solid rgba(255,165,0,0.3)',
              borderRadius: '8px',
              padding: '0.75rem',
              marginBottom: '1rem',
              color: '#FFA500',
              fontSize: '13px'
            }}>
              ⚠️ {role === 'INSTRUCTOR' ? 'Eğitmen' : 'Hakem'} hesabı admin onayı gerektirir. Onaylanana kadar sistemi görüntüleyebilirsiniz ancak işlem yapamazsınız.
            </div>
          )}

          {/* Dance Styles */}
          <label style={{ color: '#fff', display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
            Dans Türleri * (Birden fazla seçebilirsiniz)
          </label>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
            gap: '0.5rem',
            marginBottom: '1rem'
          }}>
            {availableDanceStyles.map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => toggleDanceStyle(style)}
                style={{
                  padding: '0.5rem',
                  background: danceStyles.includes(style) ? '#FF3B30' : 'rgba(255,255,255,0.05)',
                  border: '1px solid ' + (danceStyles.includes(style) ? '#FF3B30' : 'rgba(255,255,255,0.1)'),
                  borderRadius: '8px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: danceStyles.includes(style) ? '600' : '400',
                  transition: 'all 0.2s'
                }}
              >
                {style}
              </button>
            ))}
          </div>

          {/* Gender */}
          <label style={{ color: '#fff', display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
            Cinsiyet
          </label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              marginBottom: '1rem',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px'
            }}
          >
            <option value="">Seçiniz</option>
            <option value="MALE">Erkek</option>
            <option value="FEMALE">Kadın</option>
            <option value="OTHER">Diğer</option>
          </select>

          {/* Phone */}
          <label style={{ color: '#fff', display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
            Telefon
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="05XX XXX XX XX"
            style={{
              width: '100%',
              padding: '0.75rem',
              marginBottom: '1rem',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px'
            }}
          />

          {/* Experience */}
          <label style={{ color: '#fff', display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
            Deneyim (Yıl)
          </label>
          <input
            type="number"
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            placeholder="Örn: 5"
            min="0"
            max="50"
            style={{
              width: '100%',
              padding: '0.75rem',
              marginBottom: '1rem',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px'
            }}
          />

          {/* Bio */}
          <label style={{ color: '#fff', display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
            Hakkında
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Kendinizi kısaca tanıtın..."
            rows={3}
            style={{
              width: '100%',
              padding: '0.75rem',
              marginBottom: '1.5rem',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px',
              resize: 'vertical'
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '1rem',
              background: loading ? '#666' : 'linear-gradient(135deg, #FF3B30 0%, #DC2626 100%)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s'
            }}
          >
            {loading ? 'Kaydediliyor...' : 'Profili Tamamla 🚀'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileCompletionPage;
