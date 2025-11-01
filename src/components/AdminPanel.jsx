"use client";

import React, { useState, useEffect } from 'react';
import { battlesApi, authApi } from '@/lib/api-client';

/**
 * AdminPanel.jsx
 * Admin paneli - Battle yönetimi ve hakem atama
 * Modern, responsive ve kullanıcı dostu tasarım
 */

const AdminPanel = ({ onBack }) => {
  const [battles, setBattles] = useState([]);
  const [referees, setReferees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigningReferee, setAssigningReferee] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // all, needsReferee, assigned
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

  // Battle'ları filtrele
  const assignableBattles = battles.filter(b => 
    ['CONFIRMED', 'BATTLE_SCHEDULED'].includes(b.status)
  );

  const getFilteredBattles = () => {
    if (filterStatus === 'needsReferee') {
      return assignableBattles.filter(b => !b.referee);
    }
    if (filterStatus === 'assigned') {
      return assignableBattles.filter(b => b.referee);
    }
    return assignableBattles;
  };

  const filteredBattles = getFilteredBattles();

  return (
    <div className="admin-panel-root">
      {/* Header */}
      <div className="admin-header">
        <button className="back-btn" onClick={onBack}>
          <span className="back-icon">←</span>
          <span>Geri</span>
        </button>
        <div className="header-title">
          <h1>👑 Admin Paneli</h1>
          <p>Battle yönetimi ve hakem atama sistemi</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-container">
        <div className="stat-card stat-primary">
          <div className="stat-icon">⚔️</div>
          <div className="stat-content">
            <div className="stat-value">{battles.length}</div>
            <div className="stat-label">Toplam Battle</div>
          </div>
        </div>
        <div className="stat-card stat-success">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{assignableBattles.length}</div>
            <div className="stat-label">Hakem Atanabilir</div>
          </div>
        </div>
        <div className="stat-card stat-info">
          <div className="stat-icon">⚖️</div>
          <div className="stat-content">
            <div className="stat-value">{referees.length}</div>
            <div className="stat-label">Kayıtlı Hakem</div>
          </div>
        </div>
        <div className="stat-card stat-warning">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <div className="stat-value">{battles.filter(b => b.referee).length}</div>
            <div className="stat-label">Hakem Atanmış</div>
          </div>
        </div>
      </div>

      {/* Warning Box */}
      {referees.length === 0 && (
        <div className="alert alert-warning">
          <div className="alert-icon">⚠️</div>
          <div className="alert-content">
            <strong>Dikkat!</strong> Sistemde kayıtlı hakem bulunmuyor. 
            Hakem ataması yapabilmek için önce REFEREE rolünde kullanıcı kayıt etmeniz gerekiyor.
          </div>
        </div>
      )}

      {/* Battles Section */}
      <div className="battles-section">
        <div className="section-header">
          <h2>⚔️ Battle Yönetimi & Hakem Atama</h2>
          {assignableBattles.length > 0 && (
            <div className="filter-tabs">
              <button 
                className={`filter-tab ${filterStatus === 'all' ? 'active' : ''}`}
                onClick={() => setFilterStatus('all')}
              >
                Tümü ({assignableBattles.length})
              </button>
              <button 
                className={`filter-tab ${filterStatus === 'needsReferee' ? 'active' : ''}`}
                onClick={() => setFilterStatus('needsReferee')}
              >
                Hakem Bekliyor ({assignableBattles.filter(b => !b.referee).length})
              </button>
              <button 
                className={`filter-tab ${filterStatus === 'assigned' ? 'active' : ''}`}
                onClick={() => setFilterStatus('assigned')}
              >
                Atanmış ({assignableBattles.filter(b => b.referee).length})
              </button>
            </div>
          )}
        </div>
        
        {filteredBattles.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              {filterStatus === 'all' ? '📋' : filterStatus === 'needsReferee' ? '⚠️' : '✅'}
            </div>
            <h3>
              {filterStatus === 'all' 
                ? 'Hakem atanabilir battle bulunmuyor' 
                : filterStatus === 'needsReferee'
                ? 'Hakem bekleyen battle yok'
                : 'Hakem atanmış battle bulunamadı'}
            </h3>
            <p>
              {filterStatus === 'all' 
                ? 'Stüdyo onayı alan battle\'lar burada görünecek' 
                : 'Farklı bir filtre seçerek diğer battle\'ları görebilirsiniz'}
            </p>
          </div>
        ) : (
          <div className="battles-grid">
            {filteredBattles.map(battle => {
              const badge = getStatusBadge(battle.status);
              const isAssigning = assigningReferee === battle.id;
              
              return (
                <div key={battle.id} className={`battle-card ${isAssigning ? 'expanded' : ''}`}>
                  {/* Battle Header */}
                  <div className="battle-card-header">
                    <div className="battle-title-section">
                      <h3 className="battle-title">{battle.title || 'Battle'}</h3>
                      <span className="battle-category">🎵 {battle.category || 'Hip-Hop'}</span>
                    </div>
                    <span 
                      className="status-badge"
                      style={{ 
                        background: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.color}40`
                      }}
                    >
                      {badge.label}
                    </span>
                  </div>

                  {/* Participants */}
                  <div className="participants-row">
                    <div className="participant-box">
                      <div className="participant-avatar">
                        {battle.initiator?.avatar ? (
                          <img src={battle.initiator.avatar} alt={battle.initiator.name} />
                        ) : (
                          <div className="avatar-placeholder">
                            {battle.initiator?.name?.charAt(0) || '?'}
                          </div>
                        )}
                      </div>
                      <div className="participant-info">
                        <div className="participant-name">{battle.initiator?.name}</div>
                        <div className="participant-label">Challenger</div>
                      </div>
                    </div>

                    <div className="vs-divider">
                      <span>⚔️</span>
                      <span className="vs-text">VS</span>
                    </div>

                    <div className="participant-box">
                      <div className="participant-avatar">
                        {battle.challenged?.avatar ? (
                          <img src={battle.challenged.avatar} alt={battle.challenged.name} />
                        ) : (
                          <div className="avatar-placeholder">
                            {battle.challenged?.name?.charAt(0) || '?'}
                          </div>
                        )}
                      </div>
                      <div className="participant-info">
                        <div className="participant-name">{battle.challenged?.name}</div>
                        <div className="participant-label">Challenged</div>
                      </div>
                    </div>
                  </div>

                  {/* Battle Details */}
                  <div className="battle-details">
                    {battle.selectedStudio && (
                      <div className="detail-item">
                        <span className="detail-icon">🏢</span>
                        <span className="detail-text">{battle.selectedStudio.name}</span>
                      </div>
                    )}
                    {battle.scheduledDate && (
                      <div className="detail-item">
                        <span className="detail-icon">📅</span>
                        <span className="detail-text">
                          {new Date(battle.scheduledDate).toLocaleDateString('tr-TR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    )}
                    {battle.scheduledTime && (
                      <div className="detail-item">
                        <span className="detail-icon">🕐</span>
                        <span className="detail-text">{battle.scheduledTime}</span>
                      </div>
                    )}
                  </div>

                  {/* Referee Section */}
                  <div className="referee-section">
                    {battle.referee ? (
                      <div className="referee-assigned">
                        <div className="referee-info-box">
                          <div className="referee-icon">⚖️</div>
                          <div className="referee-details">
                            <div className="referee-name">{battle.referee.name}</div>
                            <div className="referee-email">{battle.referee.email}</div>
                          </div>
                        </div>
                        <button
                          className="btn-secondary"
                          onClick={() => setAssigningReferee(isAssigning ? null : battle.id)}
                        >
                          {isAssigning ? 'İptal' : 'Değiştir'}
                        </button>
                      </div>
                    ) : (
                      <div className="referee-needed">
                        <div className="warning-indicator">
                          <span className="warning-icon">⚠️</span>
                          <span className="warning-text">Hakem atanmadı</span>
                        </div>
                        <button
                          className="btn-primary"
                          onClick={() => setAssigningReferee(isAssigning ? null : battle.id)}
                          disabled={referees.length === 0}
                        >
                          {isAssigning ? 'İptal' : '🎯 Hakem Ata'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Referee Selector */}
                  {isAssigning && (
                    <div className="referee-selector">
                      <div className="selector-header">
                        <h4>Hakem Seçin</h4>
                        <p>Bir hakem seçmek için tıklayın</p>
                      </div>
                      <div className="referees-list">
                        {referees.map(referee => (
                          <div
                            key={referee.id}
                            className={`referee-option ${battle.referee?.id === referee.id ? 'selected' : ''}`}
                            onClick={() => handleAssignReferee(battle.id, referee.id)}
                          >
                            <div className="referee-option-avatar">⚖️</div>
                            <div className="referee-option-info">
                              <div className="referee-option-name">{referee.name}</div>
                              <div className="referee-option-email">{referee.email}</div>
                            </div>
                            {battle.referee?.id === referee.id && (
                              <div className="selected-badge">✓ Mevcut</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style jsx>{`
        .admin-panel-root {
          min-height: 100vh;
          background: linear-gradient(135deg, #0a0000 0%, #1a0505 50%, #0a0000 100%);
          background-size: 200% 200%;
          animation: gradientShift 10s ease infinite;
          padding: 2rem;
          font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        /* Header */
        .admin-header {
          margin-bottom: 2rem;
        }

        .back-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 12px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 500;
          transition: all 0.3s ease;
          margin-bottom: 1.5rem;
        }

        .back-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(220, 38, 38, 0.5);
          transform: translateX(-4px);
        }

        .back-icon {
          font-size: 1.2rem;
          transition: transform 0.3s;
        }

        .back-btn:hover .back-icon {
          transform: translateX(-2px);
        }

        .header-title h1 {
          font-size: 2.5rem;
          font-weight: 700;
          margin: 0 0 0.5rem 0;
          background: linear-gradient(90deg, #fff, #dc2626);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .header-title p {
          color: #9ca3af;
          margin: 0;
          font-size: 1rem;
        }

        /* Stats Container */
        .stats-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1.5rem;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, transparent, var(--stat-color), transparent);
          opacity: 0;
          transition: opacity 0.3s;
        }

        .stat-card:hover {
          background: rgba(255, 255, 255, 0.06);
          transform: translateY(-4px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .stat-card:hover::before {
          opacity: 1;
        }

        .stat-card.stat-primary { --stat-color: #dc2626; }
        .stat-card.stat-success { --stat-color: #10b981; }
        .stat-card.stat-info { --stat-color: #3b82f6; }
        .stat-card.stat-warning { --stat-color: #f59e0b; }

        .stat-icon {
          font-size: 3rem;
          opacity: 0.9;
        }

        .stat-content {
          flex: 1;
        }

        .stat-value {
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--stat-color);
          line-height: 1;
          margin-bottom: 0.25rem;
        }

        .stat-label {
          font-size: 0.9rem;
          color: #9ca3af;
          font-weight: 500;
        }

        /* Alert */
        .alert {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 1.25rem;
          border-radius: 12px;
          margin-bottom: 2rem;
        }

        .alert-warning {
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .alert-icon {
          font-size: 1.5rem;
        }

        .alert-content {
          flex: 1;
          color: #fbbf24;
          line-height: 1.6;
        }

        .alert-content strong {
          color: #fcd34d;
        }

        /* Battles Section */
        .battles-section {
          animation: fadeIn 0.5s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .section-header h2 {
          font-size: 1.8rem;
          font-weight: 700;
          margin: 0;
          color: white;
        }

        /* Filter Tabs */
        .filter-tabs {
          display: flex;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.05);
          padding: 0.5rem;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .filter-tab {
          background: transparent;
          border: none;
          color: #9ca3af;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.3s;
          white-space: nowrap;
        }

        .filter-tab:hover {
          background: rgba(255, 255, 255, 0.05);
          color: white;
        }

        .filter-tab.active {
          background: linear-gradient(90deg, #dc2626, #991b1b);
          color: white;
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
        }

        /* Empty State */
        .empty-state {
          background: rgba(255, 255, 255, 0.03);
          border: 2px dashed rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 4rem 2rem;
          text-align: center;
        }

        .empty-icon {
          font-size: 5rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .empty-state h3 {
          font-size: 1.5rem;
          color: white;
          margin: 0 0 0.5rem 0;
        }

        .empty-state p {
          color: #9ca3af;
          margin: 0;
        }

        /* Battles Grid */
        .battles-grid {
          display: grid;
          gap: 1.5rem;
        }

        .battle-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 1.5rem;
          transition: all 0.3s ease;
        }

        .battle-card:hover {
          background: rgba(255, 255, 255, 0.05);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        }

        .battle-card.expanded {
          border-color: rgba(220, 38, 38, 0.3);
        }

        /* Battle Card Header */
        .battle-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
          gap: 1rem;
        }

        .battle-title-section {
          flex: 1;
        }

        .battle-title {
          font-size: 1.3rem;
          font-weight: 600;
          color: white;
          margin: 0 0 0.5rem 0;
        }

        .battle-category {
          display: inline-block;
          font-size: 0.85rem;
          color: #9ca3af;
          background: rgba(255, 255, 255, 0.05);
          padding: 0.25rem 0.75rem;
          border-radius: 6px;
        }

        .status-badge {
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          white-space: nowrap;
        }

        /* Participants */
        .participants-row {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
          align-items: center;
        }

        .participant-box {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: rgba(255, 255, 255, 0.03);
          padding: 1rem;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .participant-avatar {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
        }

        .participant-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-placeholder {
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #dc2626, #991b1b);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 1.5rem;
        }

        .participant-info {
          flex: 1;
          min-width: 0;
        }

        .participant-name {
          font-weight: 600;
          color: white;
          margin-bottom: 0.25rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .participant-label {
          font-size: 0.75rem;
          color: #9ca3af;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .vs-divider {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
        }

        .vs-divider span:first-child {
          font-size: 1.5rem;
        }

        .vs-text {
          font-size: 0.75rem;
          color: #9ca3af;
          font-weight: 700;
        }

        /* Battle Details */
        .battle-details {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .detail-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.05);
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-size: 0.9rem;
          color: #e5e7eb;
        }

        .detail-icon {
          font-size: 1.1rem;
        }

        /* Referee Section */
        .referee-section {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 1.25rem;
        }

        .referee-assigned {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }

        .referee-info-box {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex: 1;
        }

        .referee-icon {
          font-size: 2rem;
        }

        .referee-details {
          flex: 1;
          min-width: 0;
        }

        .referee-name {
          font-weight: 600;
          color: #10b981;
          margin-bottom: 0.25rem;
        }

        .referee-email {
          font-size: 0.85rem;
          color: #9ca3af;
        }

        .referee-needed {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
        }

        .warning-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .warning-icon {
          font-size: 1.5rem;
        }

        .warning-text {
          color: #fbbf24;
          font-weight: 500;
        }

        /* Buttons */
        .btn-primary {
          background: linear-gradient(90deg, #dc2626, #991b1b);
          border: none;
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.95rem;
          font-weight: 600;
          transition: all 0.3s;
          white-space: nowrap;
        }

        .btn-primary:hover:not(:disabled) {
          box-shadow: 0 6px 20px rgba(220, 38, 38, 0.4);
          transform: translateY(-2px);
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.95rem;
          font-weight: 500;
          transition: all 0.3s;
          white-space: nowrap;
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.3);
        }

        /* Referee Selector */
        .referee-selector {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .selector-header {
          margin-bottom: 1rem;
        }

        .selector-header h4 {
          font-size: 1.1rem;
          color: white;
          margin: 0 0 0.25rem 0;
        }

        .selector-header p {
          font-size: 0.9rem;
          color: #9ca3af;
          margin: 0;
        }

        .referees-list {
          display: grid;
          gap: 0.75rem;
        }

        .referee-option {
          display: flex;
          align-items: center;
          gap: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1rem;
          cursor: pointer;
          transition: all 0.3s;
          position: relative;
        }

        .referee-option:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(220, 38, 38, 0.5);
          transform: translateX(4px);
        }

        .referee-option.selected {
          border-color: #10b981;
          background: rgba(16, 185, 129, 0.1);
        }

        .referee-option-avatar {
          font-size: 2rem;
        }

        .referee-option-info {
          flex: 1;
          min-width: 0;
        }

        .referee-option-name {
          font-weight: 600;
          color: white;
          margin-bottom: 0.25rem;
        }

        .referee-option-email {
          font-size: 0.85rem;
          color: #9ca3af;
        }

        .selected-badge {
          background: #10b981;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        /* Loading */
        .loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          gap: 1rem;
        }

        .spinner {
          border: 4px solid rgba(255, 255, 255, 0.1);
          border-top-color: #dc2626;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .loading p {
          color: #9ca3af;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .stats-container {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .admin-panel-root {
            padding: 1rem;
          }

          .header-title h1 {
            font-size: 2rem;
          }

          .stats-container {
            grid-template-columns: 1fr;
          }

          .section-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .filter-tabs {
            width: 100%;
            overflow-x: auto;
          }

          .participants-row {
            grid-template-columns: 1fr;
          }

          .vs-divider {
            flex-direction: row;
            justify-content: center;
          }

          .referee-assigned,
          .referee-needed {
            flex-direction: column;
            align-items: stretch;
          }

          .btn-primary,
          .btn-secondary {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminPanel;
