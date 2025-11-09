"use client";

import React, { useState, useEffect } from 'react';
import { battlesApi, authApi } from '@/lib/api-client';
import BattleRequestNew from './BattleRequestNew';

const BattlesPage = ({ onBack, onBattleClick }) => {
  const [battles, setBattles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filter, setFilter] = useState('ALL'); // ALL, SENT, RECEIVED
  const currentUser = authApi.getCurrentUser();

  useEffect(() => {
    loadBattles();
  }, []);

  const loadBattles = async () => {
    try {
      setLoading(true);
      const response = await battlesApi.getBattles();
      const battlesData = response.data || response || [];
      setBattles(battlesData);
    } catch (err) {
      console.error('Battle\'lar yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: { text: 'Bekliyor', color: '#FFA500', icon: '⏳' },
      CHALLENGER_ACCEPTED: { text: 'Kabul Edildi', color: '#34C759', icon: '✅' },
      STUDIO_PENDING: { text: 'Stüdyo Bekliyor', color: '#5856D6', icon: '🏢' },
      CONFIRMED: { text: 'Onaylandı', color: '#34C759', icon: '✅' },
      REJECTED: { text: 'Reddedildi', color: '#FF3B30', icon: '❌' },
      COMPLETED: { text: 'Tamamlandı', color: '#8E8E93', icon: '🏁' },
      CANCELLED: { text: 'İptal Edildi', color: '#8E8E93', icon: '🚫' },
    };
    return badges[status] || badges.PENDING;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', { 
      day: 'numeric', 
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Battle'ları filtrele
  const getFilteredBattles = () => {
    if (!currentUser) return battles;

    switch (filter) {
      case 'SENT':
        return battles.filter(b => b.initiatorId === currentUser.id);
      case 'RECEIVED':
        return battles.filter(b => b.challengedId === currentUser.id);
      default:
        return battles;
    }
  };

  const filteredBattles = getFilteredBattles();

  if (showCreateForm) {
    return (
      <BattleRequestNew 
        onBack={() => {
          setShowCreateForm(false);
          loadBattles(); // Yeni battle oluşturulunca listeyi yenile
        }} 
      />
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #000000 0%, #1a0505 100%)',
      fontFamily: "'Poppins', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    }}>
      <div className="battles-page">
      {/* Header */}
      <div className="page-header">
        <button className="back-btn" onClick={onBack}>← Geri</button>
        <h1 className="page-title">⚔️ Battle Yönetimi</h1>
        <button 
          className="create-btn"
          onClick={() => setShowCreateForm(true)}
        >
          + Yeni Battle
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button 
          className={`tab ${filter === 'ALL' ? 'active' : ''}`}
          onClick={() => setFilter('ALL')}
        >
          Tümü ({battles.length})
        </button>
        <button 
          className={`tab ${filter === 'SENT' ? 'active' : ''}`}
          onClick={() => setFilter('SENT')}
        >
          Gönderilen ({battles.filter(b => b.initiatorId === currentUser?.id).length})
        </button>
        <button 
          className={`tab ${filter === 'RECEIVED' ? 'active' : ''}`}
          onClick={() => setFilter('RECEIVED')}
        >
          Gelen ({battles.filter(b => b.challengedId === currentUser?.id).length})
        </button>
      </div>

      {/* Battles List */}
      <div className="battles-content">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Battle'lar yükleniyor...</p>
          </div>
        ) : filteredBattles.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">⚔️</div>
            <h3>Henüz battle yok</h3>
            <p>İlk battle'ını oluşturmak için "Yeni Battle" butonuna tıkla!</p>
            <button 
              className="primary-btn"
              onClick={() => setShowCreateForm(true)}
            >
              + Yeni Battle Oluştur
            </button>
          </div>
        ) : (
          <div className="battles-grid">
            {filteredBattles.map((battle) => {
              const statusBadge = getStatusBadge(battle.status);
              const isInitiator = currentUser && battle.initiatorId === currentUser.id;
              
              return (
                <div 
                  key={battle.id} 
                  className="battle-card"
                  onClick={() => onBattleClick && onBattleClick(battle.id)}
                >
                  {/* Status Badge */}
                  <div 
                    className="status-badge"
                    style={{ background: statusBadge.color }}
                  >
                    {statusBadge.icon} {statusBadge.text}
                  </div>

                  {/* Battle Type */}
                  <div className="battle-type">
                    {isInitiator ? '📤 Gönderilen' : '📥 Gelen'}
                  </div>

                  {/* Fighters */}
                  <div className="battle-fighters">
                    <div className="fighter">
                      <div className="fighter-avatar">
                        {battle.initiator.avatar ? (
                          <img src={battle.initiator.avatar} alt={battle.initiator.name} />
                        ) : (
                          <div className="avatar-placeholder">
                            {battle.initiator.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="fighter-name">{battle.initiator.name}</div>
                    </div>

                    <div className="vs">VS</div>

                    <div className="fighter">
                      <div className="fighter-avatar">
                        {battle.challenged.avatar ? (
                          <img src={battle.challenged.avatar} alt={battle.challenged.name} />
                        ) : (
                          <div className="avatar-placeholder">
                            {battle.challenged.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="fighter-name">{battle.challenged.name}</div>
                    </div>
                  </div>

                  {/* Battle Info */}
                  <div className="battle-info">
                    <div className="info-row">
                      <span className="info-label">🎵 Dans Stili:</span>
                      <span className="info-value">{battle.danceStyle}</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">📅 Tarih:</span>
                      <span className="info-value">{formatDate(battle.createdAt)}</span>
                    </div>
                  </div>

                  {/* Quick Action */}
                  {battle.status === 'PENDING' && !isInitiator && (
                    <div className="quick-action">
                      <button className="action-btn accept">✅ Kabul Et</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        .battles-page {
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

        .create-btn {
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #dc2626, #991b1b);
          border: none;
          border-radius: 10px;
          color: white;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .create-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(220, 38, 38, 0.4);
        }

        .filter-tabs {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          padding: 0.5rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .tab {
          flex: 1;
          padding: 1rem;
          background: transparent;
          border: none;
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.6);
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s;
        }

        .tab:hover {
          color: white;
          background: rgba(255, 255, 255, 0.1);
        }

        .tab.active {
          background: linear-gradient(135deg, #dc2626, #991b1b);
          color: white;
          font-weight: 600;
        }

        .battles-content {
          min-height: 400px;
        }

        .loading-state {
          text-align: center;
          padding: 4rem 2rem;
        }

        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(255, 255, 255, 0.1);
          border-top-color: #dc2626;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }

        .empty-state h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.5rem;
        }

        .empty-state p {
          margin: 0 0 2rem 0;
          color: rgba(255, 255, 255, 0.6);
        }

        .primary-btn {
          padding: 1rem 2rem;
          background: linear-gradient(135deg, #dc2626, #991b1b);
          border: none;
          border-radius: 10px;
          color: white;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .primary-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(220, 38, 38, 0.4);
        }

        .battles-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
        }

        .battle-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.3s;
          position: relative;
          overflow: hidden;
        }

        .battle-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          border-color: #dc2626;
        }

        .battle-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #dc2626, #991b1b);
        }

        .status-badge {
          display: inline-block;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }

        .battle-type {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 1rem;
        }

        .battle-fighters {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .fighter {
          flex: 1;
          text-align: center;
        }

        .fighter-avatar {
          width: 60px;
          height: 60px;
          margin: 0 auto 0.5rem;
          border-radius: 50%;
          overflow: hidden;
          border: 2px solid rgba(255, 255, 255, 0.2);
        }

        .fighter-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #dc2626, #991b1b);
          font-size: 1.5rem;
          font-weight: 700;
        }

        .fighter-name {
          font-size: 0.9rem;
          font-weight: 600;
        }

        .vs {
          font-size: 1.2rem;
          font-weight: 700;
          color: #dc2626;
          flex-shrink: 0;
        }

        .battle-info {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.9rem;
        }

        .info-label {
          color: rgba(255, 255, 255, 0.6);
        }

        .info-value {
          font-weight: 600;
        }

        .quick-action {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .action-btn {
          width: 100%;
          padding: 0.75rem;
          border: none;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .action-btn.accept {
          background: linear-gradient(135deg, #34C759, #28a745);
          color: white;
        }

        .action-btn.accept:hover {
          transform: scale(1.05);
          box-shadow: 0 5px 15px rgba(52, 199, 89, 0.4);
        }

        @media (max-width: 768px) {
          .battles-page {
            padding: 1rem;
          }

          .page-header {
            flex-direction: column;
            gap: 1rem;
          }

          .page-title {
            font-size: 1.5rem;
          }

          .battles-grid {
            grid-template-columns: 1fr;
          }

          .filter-tabs {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
    </div>
  );
};

export default BattlesPage;
