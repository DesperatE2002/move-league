"use client";

import React, { useState, useEffect } from 'react';
import { battlesApi, authApi } from '@/lib/api-client';

/**
 * AdminPanel.jsx
 * Admin paneli - Battle yönetimi ve hakem atama
 */

const AdminPanel = ({ onBack }) => {
  const [battles, setBattles] = useState([]);
  const [referees, setReferees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigningReferee, setAssigningReferee] = useState(null);
  const currentUser = authApi.getCurrentUser();

  useEffect(() => {
    if (currentUser?.role !== 'ADMIN') {
      alert('Bu sayfaya erişim yetkiniz yok!');
      onBack();
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Battle'ları yükle (onay bekleyenler ve aktif olanlar)
      const battlesResponse = await battlesApi.getBattles();
      console.log('🔍 Admin Panel - Battles Response:', battlesResponse);
      console.log('🔍 Battles Data:', battlesResponse.data);
      setBattles(battlesResponse.data || []);

      // Hakemleri yükle
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const usersResponse = await fetch('/api/users?role=REFEREE', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (usersResponse.ok) {
        const data = await usersResponse.json();
        console.log('🔍 Referees Response:', data);
        console.log('🔍 Referees Data:', data.data);
        setReferees(data.data || []);
      } else {
        console.error('❌ Referees fetch failed:', usersResponse.status);
      }

      console.log('✅ Admin panel verileri yüklendi');
    } catch (err) {
      console.error('❌ Admin panel yükleme hatası:', err);
      alert('Veriler yüklenemedi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignReferee = async (battleId, refereeId) => {
    try {
      setAssigningReferee(battleId);
      
      await battlesApi.updateBattle(battleId, {
        action: 'ASSIGN_REFEREE',
        refereeId: refereeId
      });

      alert('✅ Hakem başarıyla atandı!');
      await loadData(); // Yenile
    } catch (err) {
      console.error('❌ Hakem atama hatası:', err);
      alert('Hakem atanamadı: ' + err.message);
    } finally {
      setAssigningReferee(null);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: { label: 'Beklemede', color: '#f59e0b', bg: 'rgba(245,158,11,0.2)' },
      CHALLENGER_ACCEPTED: { label: 'Kabul Edildi', color: '#10b981', bg: 'rgba(16,185,129,0.2)' },
      STUDIO_PENDING: { label: 'Stüdyo Bekliyor', color: '#6366f1', bg: 'rgba(99,102,241,0.2)' },
      CONFIRMED: { label: 'Onaylandı', color: '#10b981', bg: 'rgba(16,185,129,0.2)' },
      BATTLE_SCHEDULED: { label: 'Planlandı', color: '#8b5cf6', bg: 'rgba(139,92,246,0.2)' },
    };
    return badges[status] || { label: status, color: '#6b7280', bg: 'rgba(107,114,128,0.2)' };
  };

  if (loading) {
    return (
      <div className="admin-panel">
        <div className="loading">
          <div className="spinner"></div>
          <p>Admin panel yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Battle'ları filtrele: Stüdyo onaylanmış veya sonrası (hakem atanabilir)
  const assignableBattles = battles.filter(b => 
    ['CONFIRMED', 'BATTLE_SCHEDULED'].includes(b.status)
  );

  return (
    <div className="admin-panel">
      <div className="panel-header">
        <button className="back-btn" onClick={onBack}>← Geri</button>
        <h1 className="panel-title">👑 Admin Paneli</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">⚔️</div>
          <div className="stat-value">{battles.length}</div>
          <div className="stat-label">Toplam Battle</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{assignableBattles.length}</div>
          <div className="stat-label">Hakem Atanabilir</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚖️</div>
          <div className="stat-value">{referees.length}</div>
          <div className="stat-label">Kayıtlı Hakem</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-value">
            {battles.filter(b => b.referee).length}
          </div>
          <div className="stat-label">Hakem Atanmış</div>
        </div>
      </div>

      {referees.length === 0 && (
        <div className="warning-box">
          ⚠️ <strong>Dikkat:</strong> Sistemde kayıtlı hakem bulunmuyor! 
          Hakem ataması yapabilmek için önce REFEREE rolünde kullanıcı kayıt etmeniz gerekiyor.
        </div>
      )}

      <div className="battles-section">
        <h2>⚔️ Battle Yönetimi & Hakem Atama</h2>
        
        {assignableBattles.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p>Hakem atanabilir battle bulunmuyor</p>
            <small>Stüdyo onayı alan battle'lar burada görünecek</small>
          </div>
        ) : (
          <div className="battles-list">
            {assignableBattles.map(battle => {
              const badge = getStatusBadge(battle.status);
              return (
                <div key={battle.id} className="battle-item">
                  <div className="battle-header">
                    <div className="battle-info">
                      <h3>{battle.title || 'Battle'}</h3>
                      <div className="battle-participants">
                        <span className="participant">{battle.initiator?.name}</span>
                        <span className="vs">⚔️ VS ⚔️</span>
                        <span className="participant">{battle.challenged?.name}</span>
                      </div>
                      <div className="battle-meta">
                        <span style={{ 
                          padding: '4px 12px', 
                          borderRadius: '12px',
                          fontSize: '0.85rem',
                          background: badge.bg,
                          color: badge.color
                        }}>
                          {badge.label}
                        </span>
                        {battle.selectedStudio && (
                          <span className="studio-badge">
                            🏢 {battle.selectedStudio.name}
                          </span>
                        )}
                        {battle.scheduledDate && (
                          <span className="date-badge">
                            📅 {new Date(battle.scheduledDate).toLocaleDateString('tr-TR')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="referee-assignment">
                      {battle.referee ? (
                        <div className="assigned-referee">
                          <div className="referee-badge">
                            ⚖️ <strong>{battle.referee.name}</strong>
                          </div>
                          <button
                            className="btn-change"
                            onClick={() => setAssigningReferee(battle.id)}
                          >
                            Değiştir
                          </button>
                        </div>
                      ) : (
                        <div className="no-referee">
                          <span className="warning-text">⚠️ Hakem atanmadı</span>
                          <button
                            className="btn-assign"
                            onClick={() => setAssigningReferee(battle.id)}
                            disabled={referees.length === 0}
                          >
                            🎯 Hakem Ata
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {assigningReferee === battle.id && (
                    <div className="referee-selector">
                      <h4>Hakem Seç:</h4>
                      <div className="referees-grid">
                        {referees.map(referee => (
                          <div
                            key={referee.id}
                            className={`referee-card ${battle.referee?.id === referee.id ? 'current' : ''}`}
                            onClick={() => handleAssignReferee(battle.id, referee.id)}
                          >
                            <div className="referee-avatar">⚖️</div>
                            <div className="referee-name">{referee.name}</div>
                            <div className="referee-email">{referee.email}</div>
                            {battle.referee?.id === referee.id && (
                              <div className="current-badge">Mevcut</div>
                            )}
                          </div>
                        ))}
                      </div>
                      <button
                        className="btn-cancel"
                        onClick={() => setAssigningReferee(null)}
                      >
                        İptal
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        .admin-panel {
          min-height: 100vh;
          background: linear-gradient(135deg, #1a1a1a 0%, #2d1a1a 100%);
          color: #fff;
          padding: 2rem;
        }

        .panel-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .back-btn {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 12px;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.3s;
        }

        .back-btn:hover {
          background: rgba(255,255,255,0.15);
        }

        .panel-title {
          font-size: 2rem;
          margin: 0;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .stat-card {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 1.5rem;
          text-align: center;
          transition: all 0.3s;
        }

        .stat-card:hover {
          background: rgba(255,255,255,0.08);
          transform: translateY(-2px);
        }

        .stat-icon {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
        }

        .stat-value {
          font-size: 2.5rem;
          font-weight: bold;
          color: #FF3B30;
          margin-bottom: 0.25rem;
        }

        .stat-label {
          font-size: 0.9rem;
          color: #b0b0b0;
        }

        .warning-box {
          background: rgba(245,158,11,0.1);
          border: 1px solid rgba(245,158,11,0.3);
          border-radius: 12px;
          padding: 1rem;
          margin-bottom: 2rem;
          color: #fbbf24;
        }

        .battles-section h2 {
          margin-bottom: 1.5rem;
        }

        .empty-state {
          background: rgba(255,255,255,0.05);
          border: 2px dashed rgba(255,255,255,0.2);
          border-radius: 16px;
          padding: 3rem;
          text-align: center;
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .battles-list {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .battle-item {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 1.5rem;
        }

        .battle-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 2rem;
        }

        .battle-info {
          flex: 1;
        }

        .battle-info h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.3rem;
        }

        .battle-participants {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .participant {
          font-weight: 600;
          color: #FF3B30;
        }

        .vs {
          color: #b0b0b0;
          font-size: 0.9rem;
        }

        .battle-meta {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .studio-badge, .date-badge {
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.85rem;
          background: rgba(255,255,255,0.1);
        }

        .referee-assignment {
          min-width: 250px;
        }

        .assigned-referee {
          background: rgba(16,185,129,0.1);
          border: 1px solid rgba(16,185,129,0.3);
          border-radius: 12px;
          padding: 1rem;
        }

        .referee-badge {
          margin-bottom: 0.5rem;
          font-size: 1.1rem;
        }

        .btn-change {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.9rem;
          width: 100%;
        }

        .btn-change:hover {
          background: rgba(255,255,255,0.15);
        }

        .no-referee {
          background: rgba(245,158,11,0.1);
          border: 1px solid rgba(245,158,11,0.3);
          border-radius: 12px;
          padding: 1rem;
          text-align: center;
        }

        .warning-text {
          display: block;
          margin-bottom: 0.75rem;
          color: #fbbf24;
        }

        .btn-assign {
          background: linear-gradient(90deg, #FF3B30, #d42b20);
          border: none;
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 600;
          width: 100%;
          transition: all 0.3s;
        }

        .btn-assign:hover:not(:disabled) {
          box-shadow: 0 6px 20px rgba(255,59,48,0.3);
          transform: translateY(-1px);
        }

        .btn-assign:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .referee-selector {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255,255,255,0.1);
        }

        .referee-selector h4 {
          margin-bottom: 1rem;
        }

        .referees-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .referee-card {
          background: rgba(255,255,255,0.05);
          border: 2px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 1rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s;
          position: relative;
        }

        .referee-card:hover {
          background: rgba(255,255,255,0.1);
          border-color: #FF3B30;
          transform: translateY(-2px);
        }

        .referee-card.current {
          border-color: #10b981;
          background: rgba(16,185,129,0.1);
        }

        .referee-avatar {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
        }

        .referee-name {
          font-weight: 600;
          margin-bottom: 0.25rem;
        }

        .referee-email {
          font-size: 0.85rem;
          color: #b0b0b0;
        }

        .current-badge {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          background: #10b981;
          color: white;
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 0.75rem;
        }

        .btn-cancel {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
          width: 100%;
        }

        .btn-cancel:hover {
          background: rgba(255,255,255,0.15);
        }

        .loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
        }

        .spinner {
          border: 4px solid rgba(255,255,255,0.1);
          border-top-color: #FF3B30;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .battle-header {
            flex-direction: column;
          }

          .referee-assignment {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminPanel;
