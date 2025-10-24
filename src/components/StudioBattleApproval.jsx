"use client";

import React, { useState, useEffect } from 'react';
import { battlesApi, authApi } from '@/lib/api-client';

const StudioBattleApproval = ({ battleId, onBack }) => {
  const [battle, setBattle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const currentUser = authApi.getCurrentUser();

  // Form states
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    loadBattleDetail();
  }, [battleId]);

  const loadBattleDetail = async () => {
    try {
      setLoading(true);
      console.log('🏢 Loading battle:', battleId);
      const response = await battlesApi.getBattles(); // Tüm battle'ları çek
      console.log('📊 All battles:', response.data);
      const foundBattle = response.data.find(b => b.id === battleId);
      console.log('✅ Found battle:', foundBattle);
      setBattle(foundBattle);
      
      // Stüdyo bilgilerini otomatik doldur
      if (currentUser?.address) {
        setLocation(currentUser.address);
      }
    } catch (err) {
      console.error('❌ Battle load error:', err);
      setError('Battle bilgileri yüklenemedi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (e) => {
    e.preventDefault();
    
    if (!scheduledDate || !scheduledTime || !location) {
      alert('Lütfen tüm alanları doldurun!');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await battlesApi.updateBattle(battleId, {
        action: 'STUDIO_APPROVE',
        scheduledDate,
        scheduledTime,
        location,
      });

      setSuccess('Battle onaylandı! Dansçılara bildirim gönderildi. 🎉');
      
      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (err) {
      setError('Battle onaylanamadı: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!confirm('Bu battle talebini reddetmek istediğinize emin misiniz?')) {
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await battlesApi.updateBattle(battleId, {
        action: 'STUDIO_REJECT',
      });

      setSuccess('Battle talebi reddedildi.');
      
      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (err) {
      setError('Battle reddedilemedi: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      STUDIO_PENDING: { text: 'Stüdyo Onayı Bekliyor', color: '#5856D6', icon: '⏳' },
      CONFIRMED: { text: 'Onaylandı', color: '#34C759', icon: '✅' },
      REJECTED: { text: 'Reddedildi', color: '#FF3B30', icon: '❌' },
      STUDIO_REJECTED: { text: 'Stüdyo Tarafından Reddedildi', color: '#FF3B30', icon: '❌' },
    };
    return badges[status] || badges.STUDIO_PENDING;
  };

  const formatDateTime = () => {
    if (!scheduledDate || !scheduledTime) return '';
    const date = new Date(scheduledDate + 'T' + scheduledTime);
    return date.toLocaleString('tr-TR', { 
      dateStyle: 'full',
      timeStyle: 'short'
    });
  };

  if (loading) {
    return (
      <div className="studio-approval-container">
        <div className="loading-state">Battle yükleniyor...</div>
      </div>
    );
  }

  if (!battle) {
    return (
      <div className="studio-approval-container">
        <div className="error-state">Battle bulunamadı</div>
        <button onClick={onBack} className="back-btn">← Geri Dön</button>
      </div>
    );
  }

  const statusBadge = getStatusBadge(battle.status);
  const canApprove = battle.status === 'STUDIO_PENDING' && currentUser?.role === 'STUDIO';

  return (
    <div className="studio-approval-container">
      <div className="page-header">
        <button className="back-btn" onClick={onBack}>← Geri</button>
        <h1 className="page-title">🏢 Battle Onay Talebi</h1>
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

      <div className="approval-card">
        {/* Status Badge */}
        <div className="status-badge" style={{ background: statusBadge.color }}>
          {statusBadge.icon} {statusBadge.text}
        </div>

        {/* Battle Info */}
        <div className="battle-info-section">
          <h2>Battle Detayları</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">🎵 Dans Stili:</span>
              <span className="value">{battle.danceStyle}</span>
            </div>
            <div className="info-item">
              <span className="label">👤 Dansçı 1:</span>
              <span className="value">{battle.initiator?.name}</span>
            </div>
            <div className="info-item">
              <span className="label">👤 Dansçı 2:</span>
              <span className="value">{battle.challenged?.name}</span>
            </div>
            <div className="info-item">
              <span className="label">📅 Talep Tarihi:</span>
              <span className="value">{new Date(battle.createdAt).toLocaleDateString('tr-TR')}</span>
            </div>
          </div>
        </div>

        {/* Approval Form */}
        {canApprove && (
          <form onSubmit={handleApprove} className="approval-form">
            <h3>📋 Battle Bilgilerini Girin</h3>
            
            <div className="form-group">
              <label htmlFor="date">📅 Tarih *</label>
              <input
                type="date"
                id="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="time">🕐 Saat *</label>
              <input
                type="time"
                id="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="location">📍 Konum/Adres *</label>
              <textarea
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Stüdyo adresi..."
                rows="3"
                required
              />
            </div>

            {scheduledDate && scheduledTime && (
              <div className="preview-box">
                <strong>📆 Battle Zamanı:</strong>
                <p>{formatDateTime()}</p>
                <p>📍 {location}</p>
              </div>
            )}

            <div className="form-actions">
              <button
                type="submit"
                className="btn-approve"
                disabled={submitting}
              >
                {submitting ? 'Onaylanıyor...' : '✅ Onayla ve Dansçılara Bildir'}
              </button>
              <button
                type="button"
                className="btn-reject"
                onClick={handleReject}
                disabled={submitting}
              >
                {submitting ? 'Reddediliyor...' : '❌ Reddet'}
              </button>
            </div>
          </form>
        )}

        {/* Already Processed */}
        {!canApprove && battle.status === 'CONFIRMED' && (
          <div className="confirmed-section">
            <h3>✅ Battle Onaylandı</h3>
            <div className="confirmed-info">
              <p><strong>📅 Tarih:</strong> {battle.scheduledDate ? new Date(battle.scheduledDate).toLocaleDateString('tr-TR') : '-'}</p>
              <p><strong>🕐 Saat:</strong> {battle.scheduledTime || '-'}</p>
              <p><strong>📍 Konum:</strong> {battle.location || '-'}</p>
            </div>
          </div>
        )}

        {battle.status === 'REJECTED' && (
          <div className="rejected-section">
            <h3>❌ Battle Reddedildi</h3>
            <p>Bu battle talebi reddedilmiştir.</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .studio-approval-container {
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

        .alert {
          padding: 1rem 1.5rem;
          border-radius: 12px;
          margin-bottom: 1.5rem;
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

        .approval-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 2rem;
          max-width: 800px;
          margin: 0 auto;
        }

        .status-badge {
          display: inline-block;
          padding: 0.75rem 1.5rem;
          border-radius: 25px;
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 2rem;
        }

        .battle-info-section {
          margin-bottom: 2rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .battle-info-section h2 {
          margin: 0 0 1.5rem 0;
          font-size: 1.5rem;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .info-item {
          display: flex;
          justify-content: space-between;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
        }

        .info-item .label {
          color: rgba(255, 255, 255, 0.6);
        }

        .info-item .value {
          font-weight: 600;
        }

        .approval-form {
          background: rgba(255, 255, 255, 0.03);
          padding: 2rem;
          border-radius: 12px;
        }

        .approval-form h3 {
          margin: 0 0 1.5rem 0;
          font-size: 1.3rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.9);
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: white;
          font-size: 1rem;
          font-family: 'Poppins', sans-serif;
          outline: none;
          transition: all 0.3s;
        }

        .form-group input:focus,
        .form-group textarea:focus {
          border-color: #5856D6;
          background: rgba(255, 255, 255, 0.15);
        }

        .form-group textarea {
          resize: vertical;
        }

        .preview-box {
          padding: 1.5rem;
          background: rgba(91, 134, 229, 0.2);
          border: 1px solid rgba(91, 134, 229, 0.4);
          border-radius: 12px;
          margin-bottom: 1.5rem;
        }

        .preview-box strong {
          display: block;
          margin-bottom: 0.5rem;
          font-size: 1.1rem;
        }

        .preview-box p {
          margin: 0.5rem 0;
          color: rgba(255, 255, 255, 0.9);
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          margin-top: 2rem;
        }

        .btn-approve,
        .btn-reject {
          flex: 1;
          padding: 1rem 2rem;
          border: none;
          border-radius: 10px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-approve {
          background: linear-gradient(135deg, #34C759, #28a745);
          color: white;
        }

        .btn-approve:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(52, 199, 89, 0.4);
        }

        .btn-reject {
          background: linear-gradient(135deg, #FF3B30, #dc2626);
          color: white;
        }

        .btn-reject:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(220, 38, 38, 0.4);
        }

        .btn-approve:disabled,
        .btn-reject:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .confirmed-section,
        .rejected-section {
          padding: 2rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          text-align: center;
        }

        .confirmed-section h3 {
          margin: 0 0 1.5rem 0;
          color: #34C759;
        }

        .confirmed-info {
          text-align: left;
          max-width: 400px;
          margin: 0 auto;
        }

        .confirmed-info p {
          margin: 1rem 0;
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
        }

        .rejected-section h3 {
          margin: 0 0 1rem 0;
          color: #FF3B30;
        }

        .loading-state,
        .error-state {
          text-align: center;
          padding: 3rem;
          font-size: 1.2rem;
        }

        @media (max-width: 768px) {
          .studio-approval-container {
            padding: 1rem;
          }

          .page-title {
            font-size: 1.5rem;
          }

          .info-grid {
            grid-template-columns: 1fr;
          }

          .form-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default StudioBattleApproval;
