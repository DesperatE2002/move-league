"use client";

import React, { useState, useEffect } from 'react';
import { battlesApi, authApi } from '@/lib/api-client';

/**
 * AdminPanel.jsx
 * Admin paneli - Battle yönetimi ve hakem atama
 * Modern, responsive ve kullanıcı dostu tasarım
 */

const AdminPanel = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('stats'); // stats, battles, users, badges, notifications
  const [battles, setBattles] = useState([]);
  const [referees, setReferees] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assigningReferee, setAssigningReferee] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [period, setPeriod] = useState('week'); // day, week, month, year, all
  const currentUser = authApi.getCurrentUser();

  useEffect(() => {
    if (currentUser?.role !== 'ADMIN') {
      alert('Bu sayfaya erişim yetkiniz yok!');
      onBack();
      return;
    }
    loadData();
  }, [activeTab, period]);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      if (activeTab === 'stats') {
        // İstatistikleri yükle
        const statsResponse = await fetch(`/api/admin/stats?period=${period}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (statsResponse.ok) {
          const data = await statsResponse.json();
          setStats(data.data);
        }
      } else if (activeTab === 'battles') {
        // Battle'ları yükle
        const battlesResponse = await battlesApi.getBattles();
        setBattles(battlesResponse.data || []);

        // Hakemleri yükle
        const usersResponse = await fetch('/api/users?role=REFEREE', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (usersResponse.ok) {
          const data = await usersResponse.json();
          setReferees(data.data || []);
        }
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

  const renderContent = () => {
    if (loading) {
      return (
        <div className="loading">
          <div className="spinner"></div>
          <p>Yükleniyor...</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'stats':
        return renderStatsTab();
      case 'battles':
        return renderBattlesTab();
      default:
        return (
          <div className="coming-soon">
            <div className="coming-soon-icon">🚧</div>
            <h3>Yakında Gelecek</h3>
            <p>Bu özellik üzerinde çalışıyoruz...</p>
          </div>
        );
    }
  };

  const renderStatsTab = () => {
    if (!stats) return null;

    return (
      <div className="stats-tab">
        {/* Period Selector */}
        <div className="period-selector">
          <button 
            className={`period-btn ${period === 'day' ? 'active' : ''}`}
            onClick={() => setPeriod('day')}
          >
            Bugün
          </button>
          <button 
            className={`period-btn ${period === 'week' ? 'active' : ''}`}
            onClick={() => setPeriod('week')}
          >
            Bu Hafta
          </button>
          <button 
            className={`period-btn ${period === 'month' ? 'active' : ''}`}
            onClick={() => setPeriod('month')}
          >
            Bu Ay
          </button>
          <button 
            className={`period-btn ${period === 'year' ? 'active' : ''}`}
            onClick={() => setPeriod('year')}
          >
            Bu Yıl
          </button>
          <button 
            className={`period-btn ${period === 'all' ? 'active' : ''}`}
            onClick={() => setPeriod('all')}
          >
            Tümü
          </button>
        </div>

        {/* Overview Stats */}
        <div className="stats-grid-large">
          <div className="stat-card-large stat-primary">
            <div className="stat-icon-large">👥</div>
            <div className="stat-content-large">
              <div className="stat-value-large">{stats.overview.totalUsers}</div>
              <div className="stat-label-large">Toplam Kullanıcı</div>
              {stats.period.newUsers > 0 && (
                <div className="stat-change positive">+{stats.period.newUsers} yeni</div>
              )}
            </div>
          </div>

          <div className="stat-card-large stat-success">
            <div className="stat-icon-large">⚔️</div>
            <div className="stat-content-large">
              <div className="stat-value-large">{stats.overview.totalBattles}</div>
              <div className="stat-label-large">Toplam Battle</div>
              {stats.period.battles > 0 && (
                <div className="stat-change positive">+{stats.period.battles} yeni</div>
              )}
            </div>
          </div>

          <div className="stat-card-large stat-info">
            <div className="stat-icon-large">🎓</div>
            <div className="stat-content-large">
              <div className="stat-value-large">{stats.overview.totalWorkshops}</div>
              <div className="stat-label-large">Toplam Workshop</div>
              {stats.period.workshops > 0 && (
                <div className="stat-change positive">+{stats.period.workshops} yeni</div>
              )}
            </div>
          </div>

          <div className="stat-card-large stat-warning">
            <div className="stat-icon-large">💰</div>
            <div className="stat-content-large">
              <div className="stat-value-large">₺{stats.revenue.total.toLocaleString()}</div>
              <div className="stat-label-large">Toplam Gelir</div>
              {stats.revenue.inPeriod > 0 && (
                <div className="stat-change positive">+₺{stats.revenue.inPeriod.toLocaleString()}</div>
              )}
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="charts-row">
          {/* Daily Battles Chart */}
          <div className="chart-card">
            <h3>📊 Günlük Battle Trendi</h3>
            <div className="chart-container">
              <div className="bar-chart">
                {stats.trends.dailyBattles.map((day, index) => {
                  const maxCount = Math.max(...stats.trends.dailyBattles.map(d => d.count));
                  const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                  
                  return (
                    <div key={index} className="bar-item">
                      <div className="bar-wrapper">
                        <div 
                          className="bar" 
                          style={{ height: `${height}%` }}
                          title={`${day.count} battle`}
                        >
                          {day.count > 0 && <span className="bar-value">{day.count}</span>}
                        </div>
                      </div>
                      <div className="bar-label">{day.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Daily Users Chart */}
          <div className="chart-card">
            <h3>👥 Günlük Kayıt Trendi</h3>
            <div className="chart-container">
              <div className="bar-chart">
                {stats.trends.dailyUsers.map((day, index) => {
                  const maxCount = Math.max(...stats.trends.dailyUsers.map(d => d.count));
                  const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                  
                  return (
                    <div key={index} className="bar-item">
                      <div className="bar-wrapper">
                        <div 
                          className="bar bar-user" 
                          style={{ height: `${height}%` }}
                          title={`${day.count} kullanıcı`}
                        >
                          {day.count > 0 && <span className="bar-value">{day.count}</span>}
                        </div>
                      </div>
                      <div className="bar-label">{day.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Top Dancers */}
        <div className="section-card">
          <h3>🏆 En Aktif Dansçılar</h3>
          <div className="top-dancers-list">
            {stats.users.topDancers.slice(0, 5).map((dancer, index) => (
              <div key={dancer.id} className="dancer-item">
                <div className="dancer-rank">#{index + 1}</div>
                <div className="dancer-avatar">
                  {dancer.avatar ? (
                    <img src={dancer.avatar} alt={dancer.name} />
                  ) : (
                    <div className="avatar-placeholder">{dancer.name.charAt(0)}</div>
                  )}
                </div>
                <div className="dancer-info">
                  <div className="dancer-name">{dancer.name}</div>
                  <div className="dancer-styles">{dancer.danceStyles.join(', ')}</div>
                </div>
                <div className="dancer-stats">
                  <div className="stat-item">
                    <span className="stat-label">Rating</span>
                    <span className="stat-value">{dancer.rating}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Battles</span>
                    <span className="stat-value">{dancer.totalBattles}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Kazanma</span>
                    <span className="stat-value">{dancer.winRate}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Studios */}
        <div className="section-card">
          <h3>🏢 En Popüler Stüdyolar</h3>
          <div className="top-studios-grid">
            {stats.battles.topStudios.map((studio, index) => (
              <div key={studio.id} className="studio-card-small">
                <div className="studio-rank">#{index + 1}</div>
                <div className="studio-icon">🏢</div>
                <div className="studio-name">{studio.name}</div>
                <div className="studio-location">{studio.city}</div>
                <div className="studio-battles">{studio._count.battleRequests} battle</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderBattlesTab = () => {
    // Mevcut battle yönetimi kodu buraya gelecek
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
      <div className="battles-management">
        {/* Mevcut battle yönetimi kodu */}
        {referees.length === 0 && (
          <div className="alert alert-warning">
            <div className="alert-icon">⚠️</div>
            <div className="alert-content">
              <strong>Dikkat!</strong> Sistemde kayıtlı hakem bulunmuyor. 
              Hakem ataması yapabilmek için önce REFEREE rolünde kullanıcı kayıt etmeniz gerekiyor.
            </div>
          </div>
        )}

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
                  {/* Mevcut battle card kodu aynı kalacak */}
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
    );
  };

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
          <p>Yönetim ve kontrol merkezi</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="admin-nav">
        <button 
          className={`nav-tab ${activeTab === 'stats' ? 'active' : ''}`}
          onClick={() => setActiveTab('stats')}
        >
          <span className="nav-icon">📊</span>
          <span>İstatistikler</span>
        </button>
        <button 
          className={`nav-tab ${activeTab === 'battles' ? 'active' : ''}`}
          onClick={() => setActiveTab('battles')}
        >
          <span className="nav-icon">⚔️</span>
          <span>Battle Yönetimi</span>
        </button>
        <button 
          className={`nav-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <span className="nav-icon">👥</span>
          <span>Kullanıcılar</span>
        </button>
        <button 
          className={`nav-tab ${activeTab === 'badges' ? 'active' : ''}`}
          onClick={() => setActiveTab('badges')}
        >
          <span className="nav-icon">🎖️</span>
          <span>Rozetler</span>
        </button>
        <button 
          className={`nav-tab ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          <span className="nav-icon">📢</span>
          <span>Bildirimler</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="admin-content">
        {renderContent()}
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

        /* Navigation Tabs */
        .admin-nav {
          display: flex;
          gap: 0.5rem;
          background: rgba(255, 255, 255, 0.03);
          padding: 0.75rem;
          border-radius: 16px;
          margin-bottom: 2rem;
          overflow-x: auto;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .nav-tab {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: transparent;
          border: none;
          color: #9ca3af;
          padding: 0.75rem 1.5rem;
          border-radius: 12px;
          cursor: pointer;
          font-size: 0.95rem;
          font-weight: 500;
          transition: all 0.3s;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .nav-tab:hover {
          background: rgba(255, 255, 255, 0.05);
          color: white;
        }

        .nav-tab.active {
          background: linear-gradient(90deg, #dc2626, #991b1b);
          color: white;
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
        }

        .nav-icon {
          font-size: 1.2rem;
        }

        /* Admin Content */
        .admin-content {
          animation: fadeIn 0.3s ease;
        }

        /* Coming Soon */
        .coming-soon {
          text-align: center;
          padding: 6rem 2rem;
        }

        .coming-soon-icon {
          font-size: 6rem;
          margin-bottom: 1.5rem;
          opacity: 0.5;
        }

        .coming-soon h3 {
          font-size: 2rem;
          color: white;
          margin: 0 0 0.5rem 0;
        }

        .coming-soon p {
          color: #9ca3af;
          font-size: 1.1rem;
        }

        /* Stats Tab */
        .stats-tab {
          animation: slideUp 0.4s ease;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Period Selector */
        .period-selector {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }

        .period-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #9ca3af;
          padding: 0.75rem 1.5rem;
          border-radius: 10px;
          cursor: pointer;
          font-size: 0.95rem;
          font-weight: 500;
          transition: all 0.3s;
        }

        .period-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          color: white;
        }

        .period-btn.active {
          background: linear-gradient(90deg, #dc2626, #991b1b);
          color: white;
          border-color: transparent;
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
        }

        /* Large Stats Grid */
        .stats-grid-large {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .stat-card-large {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 2rem;
          display: flex;
          align-items: center;
          gap: 1.5rem;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .stat-card-large::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, transparent, var(--stat-color), transparent);
        }

        .stat-card-large:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
        }

        .stat-icon-large {
          font-size: 3.5rem;
          opacity: 0.9;
        }

        .stat-content-large {
          flex: 1;
        }

        .stat-value-large {
          font-size: 3rem;
          font-weight: 700;
          color: var(--stat-color);
          line-height: 1;
          margin-bottom: 0.5rem;
        }

        .stat-label-large {
          font-size: 1rem;
          color: #9ca3af;
          font-weight: 500;
          margin-bottom: 0.5rem;
        }

        .stat-change {
          display: inline-block;
          font-size: 0.9rem;
          padding: 0.25rem 0.75rem;
          border-radius: 6px;
          font-weight: 600;
        }

        .stat-change.positive {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
        }

        /* Charts Row */
        .charts-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .chart-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 1.5rem;
        }

        .chart-card h3 {
          font-size: 1.2rem;
          color: white;
          margin: 0 0 1.5rem 0;
        }

        .chart-container {
          height: 250px;
        }

        .bar-chart {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          height: 100%;
          gap: 0.5rem;
        }

        .bar-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .bar-wrapper {
          width: 100%;
          height: 200px;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }

        .bar {
          width: 100%;
          background: linear-gradient(180deg, #dc2626, #991b1b);
          border-radius: 8px 8px 0 0;
          position: relative;
          min-height: 4px;
          transition: all 0.3s;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 0.5rem;
        }

        .bar:hover {
          box-shadow: 0 0 20px rgba(220, 38, 38, 0.5);
          transform: scaleY(1.05);
        }

        .bar-user {
          background: linear-gradient(180deg, #3b82f6, #1e40af);
        }

        .bar-user:hover {
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
        }

        .bar-value {
          font-size: 0.75rem;
          color: white;
          font-weight: 600;
        }

        .bar-label {
          margin-top: 0.5rem;
          font-size: 0.75rem;
          color: #9ca3af;
          text-align: center;
        }

        /* Section Card */
        .section-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }

        .section-card h3 {
          font-size: 1.3rem;
          color: white;
          margin: 0 0 1.5rem 0;
        }

        /* Top Dancers List */
        .top-dancers-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .dancer-item {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 1rem;
          transition: all 0.3s;
        }

        .dancer-item:hover {
          background: rgba(255, 255, 255, 0.05);
          transform: translateX(4px);
        }

        .dancer-rank {
          font-size: 1.5rem;
          font-weight: 700;
          color: #dc2626;
          min-width: 40px;
          text-align: center;
        }

        .dancer-avatar {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
        }

        .dancer-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .dancer-info {
          flex: 1;
          min-width: 0;
        }

        .dancer-name {
          font-size: 1.1rem;
          font-weight: 600;
          color: white;
          margin-bottom: 0.25rem;
        }

        .dancer-styles {
          font-size: 0.9rem;
          color: #9ca3af;
        }

        .dancer-stats {
          display: flex;
          gap: 2rem;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .stat-item .stat-label {
          font-size: 0.75rem;
          color: #9ca3af;
          margin-bottom: 0.25rem;
        }

        .stat-item .stat-value {
          font-size: 1.2rem;
          font-weight: 700;
          color: #dc2626;
        }

        /* Top Studios Grid */
        .top-studios-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 1rem;
        }

        .studio-card-small {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 1.5rem;
          text-align: center;
          transition: all 0.3s;
          position: relative;
        }

        .studio-card-small:hover {
          background: rgba(255, 255, 255, 0.05);
          transform: translateY(-4px);
        }

        .studio-rank {
          position: absolute;
          top: 0.75rem;
          right: 0.75rem;
          background: linear-gradient(135deg, #dc2626, #991b1b);
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.9rem;
        }

        .studio-icon {
          font-size: 2.5rem;
          margin-bottom: 0.75rem;
        }

        .studio-name {
          font-size: 1rem;
          font-weight: 600;
          color: white;
          margin-bottom: 0.5rem;
        }

        .studio-location {
          font-size: 0.85rem;
          color: #9ca3af;
          margin-bottom: 0.75rem;
        }

        .studio-battles {
          font-size: 0.9rem;
          color: #dc2626;
          font-weight: 600;
        }

        /* Battles Management */
        .battles-management {
          animation: slideUp 0.4s ease;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .stats-grid-large {
            grid-template-columns: repeat(2, 1fr);
          }

          .charts-row {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .admin-panel-root {
            padding: 1rem;
          }

          .header-title h1 {
            font-size: 2rem;
          }

          .admin-nav {
            overflow-x: auto;
          }

          .stats-grid-large {
            grid-template-columns: 1fr;
          }

          .period-selector {
            overflow-x: auto;
          }

          .charts-row {
            grid-template-columns: 1fr;
          }

          .dancer-stats {
            gap: 1rem;
          }

          .top-studios-grid {
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
