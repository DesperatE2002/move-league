"use client";

import React, { useState, useEffect } from 'react';
import { studiosApi, battlesApi, authApi } from '@/lib/api-client';

const StudioSelection = ({ battleId, onBack, onComplete }) => {
  const [studios, setStudios] = useState([]);
  const [selectedStudios, setSelectedStudios] = useState([]); // [{id, priority}, ...]
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const currentUser = authApi.getCurrentUser();

  useEffect(() => {
    loadStudios();
  }, []);

  const loadStudios = async () => {
    try {
      setLoading(true);
      console.log('🏢 Stüdyolar yükleniyor...');
      const response = await studiosApi.getStudios();
      console.log('✅ Stüdyo response:', response);
      setStudios(response.data || []);
      console.log(`✅ ${response.data?.length || 0} stüdyo yüklendi`);
    } catch (err) {
      console.error('❌ Stüdyo yükleme hatası:', err);
      setError('Stüdyolar yüklenemedi: ' + (err.message || 'Bilinmeyen hata'));
    } finally {
      setLoading(false);
    }
  };

  const handleStudioSelect = (studio) => {
    // Eğer zaten seçiliyse, çıkar
    if (selectedStudios.find(s => s.id === studio.id)) {
      setSelectedStudios(selectedStudios.filter(s => s.id !== studio.id));
      return;
    }

    // Maksimum 3 stüdyo seçilebilir
    if (selectedStudios.length >= 3) {
      alert('En fazla 3 stüdyo seçebilirsiniz!');
      return;
    }

    // Yeni stüdyoyu ekle, priority otomatik (sıradaki numara)
    setSelectedStudios([...selectedStudios, {
      id: studio.id,
      name: studio.name,
      priority: selectedStudios.length + 1
    }]);
  };

  const handleRemoveStudio = (studioId) => {
    const newSelected = selectedStudios
      .filter(s => s.id !== studioId)
      .map((s, index) => ({ ...s, priority: index + 1 })); // Öncelikleri yeniden düzenle
    setSelectedStudios(newSelected);
  };

  const handleMovePriority = (studioId, direction) => {
    const index = selectedStudios.findIndex(s => s.id === studioId);
    if (index === -1) return;

    const newSelected = [...selectedStudios];

    if (direction === 'up' && index > 0) {
      // Yukarı taşı
      [newSelected[index], newSelected[index - 1]] = [newSelected[index - 1], newSelected[index]];
    } else if (direction === 'down' && index < newSelected.length - 1) {
      // Aşağı taşı
      [newSelected[index], newSelected[index + 1]] = [newSelected[index + 1], newSelected[index]];
    }

    // Öncelikleri güncelle
    newSelected.forEach((s, idx) => s.priority = idx + 1);
    setSelectedStudios(newSelected);
  };

  const handleSubmit = async () => {
    if (selectedStudios.length < 3) {
      alert('Lütfen en az 3 stüdyo seçin!');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // API'ye stüdyo seçimlerini gönder
      // Backend studioPreferences bekliyor: [{studioId, priority}, ...]
      await battlesApi.updateBattle(battleId, {
        action: 'SELECT_STUDIOS',
        studioPreferences: selectedStudios.map(s => ({
          studioId: s.id,
          priority: s.priority
        }))
      });

      setSuccess('Stüdyo seçimlerin kaydedildi! ✅');
      
      setTimeout(() => {
        if (onComplete) onComplete();
        else if (onBack) onBack();
      }, 2000);
    } catch (err) {
      setError('Stüdyo seçimleri kaydedilemedi: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStudios = studios.filter(studio => 
    studio.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    studio.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isSelected = (studioId) => selectedStudios.find(s => s.id === studioId);

  return (
    <div className="studio-selection">
      <div className="page-header">
        <button className="back-btn" onClick={onBack}>← Geri</button>
        <h1 className="page-title">🏢 Stüdyo Seçimi</h1>
      </div>

      <div className="info-banner">
        <div className="info-icon">ℹ️</div>
        <div className="info-text">
          <strong>En az 3 stüdyo seçin ve öncelik sıralaması yapın</strong>
          <p>Rakibinizle ortak olan ve en yüksek önceliğe sahip stüdyo battle için seçilecek.</p>
        </div>
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

      <div className="selection-container">
        {/* Sol Panel - Seçilen Stüdyolar */}
        <div className="selected-panel">
          <div className="panel-header">
            <h2>Seçilen Stüdyolar ({selectedStudios.length}/3)</h2>
          </div>

          {selectedStudios.length === 0 ? (
            <div className="empty-selection">
              <div className="empty-icon">🏢</div>
              <p>Henüz stüdyo seçmediniz</p>
              <small>Sağdaki listeden en az 3 stüdyo seçin</small>
            </div>
          ) : (
            <div className="selected-list">
              {selectedStudios.map((studio, index) => (
                <div key={studio.id} className="selected-item">
                  <div className="priority-badge">{studio.priority}</div>
                  <div className="studio-info">
                    <h3>{studio.name}</h3>
                  </div>
                  <div className="item-actions">
                    <button
                      className="move-btn"
                      onClick={() => handleMovePriority(studio.id, 'up')}
                      disabled={index === 0}
                      title="Yukarı taşı"
                    >
                      ↑
                    </button>
                    <button
                      className="move-btn"
                      onClick={() => handleMovePriority(studio.id, 'down')}
                      disabled={index === selectedStudios.length - 1}
                      title="Aşağı taşı"
                    >
                      ↓
                    </button>
                    <button
                      className="remove-btn"
                      onClick={() => handleRemoveStudio(studio.id)}
                      title="Kaldır"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedStudios.length >= 3 && (
            <button
              className="submit-btn"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? 'Kaydediliyor...' : '✅ Seçimleri Onayla'}
            </button>
          )}
        </div>

        {/* Sağ Panel - Tüm Stüdyolar */}
        <div className="studios-panel">
          <div className="panel-header">
            <h2>Mevcut Stüdyolar</h2>
            <input
              type="text"
              className="search-input"
              placeholder="🔍 Stüdyo ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Stüdyolar yükleniyor...</p>
            </div>
          ) : (
            <div className="studios-list">
              {filteredStudios.map(studio => {
                const selected = isSelected(studio.id);
                return (
                  <div
                    key={studio.id}
                    className={`studio-card ${selected ? 'selected' : ''}`}
                    onClick={() => !selected && handleStudioSelect(studio)}
                  >
                    <div className="studio-header">
                      <h3 className="studio-name">{studio.name}</h3>
                      {selected && (
                        <span className="selected-badge">
                          ✓ Seçildi (#{selected.priority})
                        </span>
                      )}
                    </div>
                    {studio.location && (
                      <p className="studio-location">📍 {studio.location}</p>
                    )}
                    {studio.capacity && (
                      <p className="studio-capacity">👥 Kapasite: {studio.capacity}</p>
                    )}
                    {studio.hourlyRate && (
                      <p className="studio-rate">💰 {studio.hourlyRate} ₺/saat</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .studio-selection {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
          color: white;
          font-family: 'Poppins', sans-serif;
          padding: 2rem;
        }

        .page-header {
          display: flex;
          align-items: center;
          gap: 2rem;
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .back-btn {
          padding: 0.75rem 1.5rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          color: white;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s;
        }

        .back-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateX(-5px);
        }

        .page-title {
          flex: 1;
          margin: 0;
          font-size: 2rem;
          font-weight: 700;
        }

        .info-banner {
          display: flex;
          gap: 1rem;
          padding: 1.5rem;
          background: rgba(91, 134, 229, 0.2);
          border: 1px solid rgba(91, 134, 229, 0.4);
          border-radius: 12px;
          margin-bottom: 2rem;
        }

        .info-icon {
          font-size: 2rem;
        }

        .info-text {
          flex: 1;
        }

        .info-text strong {
          display: block;
          margin-bottom: 0.5rem;
          font-size: 1.1rem;
        }

        .info-text p {
          margin: 0;
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.9rem;
        }

        .alert {
          padding: 1rem 1.5rem;
          border-radius: 12px;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .alert-error {
          background: rgba(220, 38, 38, 0.2);
          border: 1px solid #dc2626;
          color: #fca5a5;
        }

        .alert-success {
          background: rgba(52, 199, 89, 0.2);
          border: 1px solid #34C759;
          color: #86efac;
        }

        .selection-container {
          display: grid;
          grid-template-columns: 400px 1fr;
          gap: 2rem;
          height: calc(100vh - 300px);
        }

        .selected-panel, .studios-panel {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .panel-header {
          padding: 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          background: rgba(255, 255, 255, 0.03);
        }

        .panel-header h2 {
          margin: 0 0 1rem 0;
          font-size: 1.3rem;
        }

        .search-input {
          width: 100%;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: white;
          font-size: 1rem;
          outline: none;
        }

        .search-input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        .empty-selection {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 2rem;
          text-align: center;
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .empty-selection p {
          margin: 0 0 0.5rem 0;
          font-size: 1.1rem;
          color: rgba(255, 255, 255, 0.8);
        }

        .empty-selection small {
          color: rgba(255, 255, 255, 0.5);
        }

        .selected-list {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
        }

        .selected-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 12px;
          margin-bottom: 0.75rem;
          transition: all 0.3s;
        }

        .selected-item:hover {
          background: rgba(255, 255, 255, 0.12);
        }

        .priority-badge {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #dc2626, #991b1b);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          font-weight: 700;
          flex-shrink: 0;
        }

        .studio-info {
          flex: 1;
        }

        .studio-info h3 {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
        }

        .item-actions {
          display: flex;
          gap: 0.5rem;
        }

        .move-btn, .remove-btn {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.1);
          color: white;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s;
        }

        .move-btn:hover:not(:disabled) {
          background: rgba(91, 134, 229, 0.3);
          border-color: #5b86e5;
        }

        .move-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }

        .remove-btn:hover {
          background: rgba(220, 38, 38, 0.3);
          border-color: #dc2626;
        }

        .submit-btn {
          margin: 1rem;
          padding: 1rem;
          background: linear-gradient(135deg, #34C759, #28a745);
          border: none;
          border-radius: 12px;
          color: white;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(52, 199, 89, 0.4);
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .studios-list {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
          align-content: start;
        }

        .studio-card {
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .studio-card:hover:not(.selected) {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-3px);
          border-color: #dc2626;
        }

        .studio-card.selected {
          background: rgba(52, 199, 89, 0.2);
          border-color: #34C759;
          cursor: default;
        }

        .studio-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .studio-name {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
        }

        .selected-badge {
          padding: 0.25rem 0.5rem;
          background: #34C759;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .studio-location,
        .studio-capacity,
        .studio-rate {
          margin: 0.5rem 0 0 0;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .loading-state {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
        }

        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(255, 255, 255, 0.1);
          border-top-color: #dc2626;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 1024px) {
          .selection-container {
            grid-template-columns: 1fr;
            height: auto;
          }

          .selected-panel {
            order: 2;
          }

          .studios-panel {
            order: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default StudioSelection;
