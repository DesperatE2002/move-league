"use client";

import React, { useState, useEffect } from 'react';
import { usersApi, battlesApi } from '@/lib/api-client';

const BattleRequest = ({ onBack }) => {
  const [dancers, setDancers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDancer, setSelectedDancer] = useState(null);
  const [formData, setFormData] = useState({
    danceStyle: 'Hip-Hop',
    description: '',
  });

  useEffect(() => {
    loadDancers();
  }, []);

  const loadDancers = async () => {
    try {
      setLoading(true);
      const response = await usersApi.getUsers({ role: 'DANCER' });
      setDancers(response.data || []);
    } catch (err) {
      setError('Dansçılar yüklenemedi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedDancer) {
      setError('Lütfen bir dansçı seçin!');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await battlesApi.createBattle({
        challengedId: selectedDancer.id,
        danceStyle: formData.danceStyle,
        description: formData.description,
      });

      setSuccess(`Battle talebi ${selectedDancer.name} adlı dansçıya gönderildi! 🎉`);
      
      // Form'u resetle
      setSelectedDancer(null);
      setFormData({ danceStyle: 'Hip-Hop', description: '' });
      
      // 2 saniye sonra geri dön
      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (err) {
      setError('Battle oluşturulamadı: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDancers = dancers.filter(dancer => 
    dancer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dancer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (dancer.danceStyles || []).some(style => style.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const danceStyles = [
    'Hip-Hop',
    'Breaking',
    'Popping',
    'Locking',
    'House',
    'Krump',
    'Freestyle',
    'Contemporary',
  ];

  return (
    <div className="battle-request-container">
      <div className="page-header">
        <button className="back-btn" onClick={onBack}>← Geri</button>
        <h1 className="page-title">⚔️ Yeni Battle Talebi</h1>
      </div>

      {error && (
        <div className="alert alert-error">
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          ✅ {success}
        </div>
      )}

      <div className="battle-content">
        {/* Sol Panel: Dansçı Seçimi */}
        <div className="dancers-panel">
          <h2 className="panel-title">1. Rakip Seç</h2>
          
          <div className="search-box">
            <input
              type="text"
              placeholder="🔍 Dansçı ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          {loading ? (
            <div className="loading">Dansçılar yükleniyor...</div>
          ) : (
            <div className="dancers-list">
              {filteredDancers.length === 0 ? (
                <div className="no-dancers">
                  Dansçı bulunamadı
                </div>
              ) : (
                filteredDancers.map(dancer => (
                  <div
                    key={dancer.id}
                    className={`dancer-card ${selectedDancer?.id === dancer.id ? 'selected' : ''}`}
                    onClick={() => setSelectedDancer(dancer)}
                  >
                    <div className="dancer-avatar">
                      {dancer.avatar ? (
                        <img src={dancer.avatar} alt={dancer.name} />
                      ) : (
                        <div className="avatar-placeholder">
                          {dancer.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    
                    <div className="dancer-info">
                      <h3 className="dancer-name">{dancer.name}</h3>
                      <p className="dancer-email">{dancer.email}</p>
                      {dancer.danceStyles && dancer.danceStyles.length > 0 && (
                        <div className="dancer-styles">
                          {dancer.danceStyles.map((style, idx) => (
                            <span key={idx} className="style-tag">{style}</span>
                          ))}
                        </div>
                      )}
                      {dancer.bio && (
                        <p className="dancer-bio">{dancer.bio}</p>
                      )}
                    </div>
                    
                    {selectedDancer?.id === dancer.id && (
                      <div className="check-icon">✓</div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Sağ Panel: Battle Detayları */}
        <div className="battle-form-panel">
          <h2 className="panel-title">2. Battle Detayları</h2>
          
          <form onSubmit={handleSubmit} className="battle-form">
            <div className="form-group">
              <label>Dans Stili *</label>
              <select
                value={formData.danceStyle}
                onChange={(e) => setFormData({ ...formData, danceStyle: e.target.value })}
                className="form-select"
                required
              >
                {danceStyles.map(style => (
                  <option key={style} value={style}>{style}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Açıklama (Opsiyonel)</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Battle hakkında notlarınız..."
                rows="4"
                className="form-textarea"
              />
            </div>

            {selectedDancer && (
              <div className="selected-dancer-preview">
                <h3>Seçilen Rakip:</h3>
                <div className="preview-card">
                  <div className="preview-avatar">
                    {selectedDancer.avatar ? (
                      <img src={selectedDancer.avatar} alt={selectedDancer.name} />
                    ) : (
                      <div className="avatar-placeholder">
                        {selectedDancer.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="preview-name">{selectedDancer.name}</p>
                    <p className="preview-email">{selectedDancer.email}</p>
                  </div>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              className="submit-btn"
              disabled={!selectedDancer || submitting}
            >
              {submitting ? 'Gönderiliyor...' : '🔥 Battle Talebi Gönder'}
            </button>
          </form>
        </div>
      </div>

      <style jsx>{`
        .battle-request-container {
          padding: 2rem;
          min-height: 100vh;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          color: white;
        }

        .page-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .back-btn {
          padding: 0.75rem 1.5rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.3s;
        }

        .back-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateX(-5px);
        }

        .page-title {
          font-size: 2.5rem;
          font-weight: 700;
          margin: 0;
        }

        .alert {
          padding: 1rem 1.5rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          animation: slideIn 0.3s ease-out;
        }

        .alert-error {
          background: #fecaca;
          color: #991b1b;
          border: 1px solid #f87171;
        }

        .alert-success {
          background: #d1fae5;
          color: #065f46;
          border: 1px solid #34d399;
        }

        .battle-content {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
        }

        .dancers-panel, .battle-form-panel {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 2rem;
          backdrop-filter: blur(10px);
        }

        .panel-title {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          color: #dc2626;
        }

        .search-box {
          margin-bottom: 1.5rem;
        }

        .search-input {
          width: 100%;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: white;
          font-size: 1rem;
        }

        .search-input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        .dancers-list {
          max-height: 600px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .dancers-list::-webkit-scrollbar {
          width: 8px;
        }

        .dancers-list::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }

        .dancers-list::-webkit-scrollbar-thumb {
          background: #dc2626;
          border-radius: 4px;
        }

        .dancer-card {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s;
          position: relative;
        }

        .dancer-card:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: #dc2626;
          transform: translateY(-2px);
        }

        .dancer-card.selected {
          background: rgba(220, 38, 38, 0.2);
          border-color: #dc2626;
          box-shadow: 0 0 20px rgba(220, 38, 38, 0.3);
        }

        .dancer-avatar {
          flex-shrink: 0;
        }

        .dancer-avatar img, .avatar-placeholder {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          object-fit: cover;
        }

        .avatar-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #dc2626, #ef4444);
          font-size: 1.5rem;
          font-weight: 700;
          color: white;
        }

        .dancer-info {
          flex: 1;
        }

        .dancer-name {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0 0 0.25rem 0;
        }

        .dancer-email {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.6);
          margin: 0 0 0.5rem 0;
        }

        .dancer-styles {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .style-tag {
          padding: 0.25rem 0.75rem;
          background: rgba(220, 38, 38, 0.2);
          border: 1px solid #dc2626;
          border-radius: 12px;
          font-size: 0.8rem;
          color: #fca5a5;
        }

        .dancer-bio {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
        }

        .check-icon {
          position: absolute;
          top: 1rem;
          right: 1rem;
          width: 30px;
          height: 30px;
          background: #dc2626;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          font-weight: bold;
        }

        .loading, .no-dancers {
          text-align: center;
          padding: 2rem;
          color: rgba(255, 255, 255, 0.6);
        }

        .battle-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
        }

        .form-select, .form-textarea {
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: white;
          font-size: 1rem;
        }

        .form-select option {
          background: #1a1a2e;
          color: white;
        }

        .form-textarea {
          resize: vertical;
          font-family: inherit;
        }

        .selected-dancer-preview {
          padding: 1rem;
          background: rgba(220, 38, 38, 0.1);
          border: 1px solid #dc2626;
          border-radius: 8px;
        }

        .selected-dancer-preview h3 {
          margin: 0 0 1rem 0;
          font-size: 1rem;
          color: #fca5a5;
        }

        .preview-card {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .preview-avatar img, .preview-avatar .avatar-placeholder {
          width: 50px;
          height: 50px;
          border-radius: 50%;
        }

        .preview-name {
          font-weight: 600;
          margin: 0 0 0.25rem 0;
        }

        .preview-email {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.6);
          margin: 0;
        }

        .submit-btn {
          padding: 1rem 2rem;
          background: linear-gradient(135deg, #dc2626, #ef4444);
          border: none;
          border-radius: 8px;
          color: white;
          font-size: 1.1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .submit-btn:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 10px 30px rgba(220, 38, 38, 0.4);
        }

        .submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 1024px) {
          .battle-content {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default BattleRequest;
