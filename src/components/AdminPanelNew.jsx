"use client";

import React, { useState, useEffect } from 'react';
import { battlesApi, authApi, adminApi } from '@/lib/api-client';
import './AdminPanel.css';

/**
 * AdminPanel.jsx - Geliştirilmiş Admin Paneli
 * - Dashboard: Genel istatistikler ve hakem atama
 * - Kullanıcı Yönetimi: Rol değiştir, aktif/pasif yap, sil
 * - Battle Yönetimi: İptal et, sonuç düzenle
 * - Rozet Sistemi: Rozet ekle/çıkar
 * - Sezon Sıfırlama: Tam sıfırlama veya %20 taşıma
 */

const AdminPanel = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [battles, setBattles] = useState([]);
  const [referees, setReferees] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigningReferee, setAssigningReferee] = useState(null);
  const currentUser = authApi.getCurrentUser();

  // Modal states
  const [badgeModal, setBadgeModal] = useState({ open: false, user: null });
  const [seasonModal, setSeasonModal] = useState(false);

  useEffect(() => {
    if (currentUser?.role !== 'ADMIN') {
      alert('Bu sayfaya erişim yetkiniz yok!');
      onBack();
      return;
    }
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Battle'ları yükle
      const battlesResponse = await battlesApi.getBattles();
      setBattles(battlesResponse.data || []);

      // Hakemleri yükle
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const refResponse = await fetch('/api/users?role=REFEREE', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (refResponse.ok) {
        const data = await refResponse.json();
        setReferees(data.data || []);
      }

      // Tüm kullanıcıları her zaman yükle
      const usersData = await adminApi.getAllUsers();
      console.log('🔍 Admin - Users Response:', usersData);
      setAllUsers(usersData.data?.users || []);

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
      await loadData();
    } catch (err) {
      console.error('❌ Hakem atama hatası:', err);
      alert('Hakem atanamadı: ' + err.message);
    } finally {
      setAssigningReferee(null);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminApi.updateUser(userId, { role: newRole });
      alert('✅ Kullanıcı rolü güncellendi!');
      await loadData();
    } catch (err) {
      alert('❌ Rol güncellenemedi: ' + err.message);
    }
  };

  const handleToggleActive = async (userId, isActive) => {
    try {
      await adminApi.updateUser(userId, { isActive: !isActive });
      alert(`✅ Kullanıcı ${!isActive ? 'aktif' : 'pasif'} edildi!`);
      await loadData();
    } catch (err) {
      alert('❌ İşlem başarısız: ' + err.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) return;
    try {
      await adminApi.deleteUser(userId);
      alert('✅ Kullanıcı silindi!');
      await loadData();
    } catch (err) {
      alert('❌ Silme başarısız: ' + err.message);
    }
  };

  const handleDeleteBattle = async (battleId) => {
    if (!confirm('Bu battle\'ı iptal etmek istediğinizden emin misiniz? Puanlar geri alınacak.')) return;
    try {
      await adminApi.deleteBattle(battleId);
      alert('✅ Battle iptal edildi!');
      await loadData();
    } catch (err) {
      alert('❌ İptal başarısız: ' + err.message);
    }
  };

  const handleAssignBadge = async (userId, badge) => {
    try {
      await adminApi.assignBadge(userId, badge);
      alert('✅ Rozet eklendi!');
      setBadgeModal({ open: false, user: null });
      await loadData();
    } catch (err) {
      alert('❌ Rozet eklenemedi: ' + err.message);
    }
  };

  const handleRemoveBadge = async (userId, badge) => {
    try {
      await adminApi.removeBadge(userId, badge);
      alert('✅ Rozet kaldırıldı!');
      await loadData();
    } catch (err) {
      alert('❌ Rozet kaldırılamadı: ' + err.message);
    }
  };

  const handleSeasonReset = async (mode) => {
    const seasonName = prompt('Sezon adı girin (örn: Sezon 2025)');
    if (!seasonName) return;

    const confirmMsg = mode === 'full' 
      ? 'Tüm dansçılar 1200 puana sıfırlanacak. Emin misiniz?'
      : 'Dansçılar 1200 + (%20 eski puan) olacak. Emin misiniz?';
    
    if (!confirm(confirmMsg)) return;

    try {
      const result = await adminApi.resetSeason(mode, seasonName);
      alert(`✅ ${result.data?.message}\n${result.data?.totalUsers} kullanıcı güncellendi.`);
      setSeasonModal(false);
    } catch (err) {
      alert('❌ Sezon sıfırlama başarısız: ' + err.message);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: { label: 'Beklemede', color: '#f59e0b', bg: 'rgba(245,158,11,0.2)' },
      CHALLENGER_ACCEPTED: { label: 'Kabul Edildi', color: '#10b981', bg: 'rgba(16,185,129,0.2)' },
      STUDIO_PENDING: { label: 'Stüdyo Bekliyor', color: '#6366f1', bg: 'rgba(99,102,241,0.2)' },
      CONFIRMED: { label: 'Onaylandı', color: '#10b981', bg: 'rgba(16,185,129,0.2)' },
      BATTLE_SCHEDULED: { label: 'Planlandı', color: '#8b5cf6', bg: 'rgba(139,92,246,0.2)' },
      COMPLETED: { label: 'Tamamlandı', color: '#10b981', bg: 'rgba(16,185,129,0.2)' },
    };
    return badges[status] || { label: status, color: '#6b7280', bg: 'rgba(107,114,128,0.2)' };
  };

  const availableBadges = [
    { id: 'admin', label: '👑 Admin', desc: 'Platform yöneticisi' },
    { id: 'founder', label: '🏆 Kurucu', desc: 'İlk üyeler' },
    { id: 'veteran', label: '⚔️ Veteran', desc: '50+ battle' },
    { id: 'first_battle', label: '🎯 İlk Battle', desc: 'İlk battle katılımı' },
    { id: 'first_win', label: '🥇 İlk Zafer', desc: 'İlk battle zaferi' },
    { id: 'streak_3', label: '🔥 3 Seri', desc: '3 üst üste galibiyet' },
    { id: 'streak_5', label: '💥 5 Seri', desc: '5 üst üste galibiyet' },
    { id: 'workshop_1', label: '📚 Workshop 1', desc: 'İlk workshop' },
    { id: 'workshop_5', label: '🎓 Workshop 5', desc: '5 workshop tamamla' },
    { id: 'workshop_10', label: '🏅 Workshop 10', desc: '10 workshop tamamla' },
    { id: 'master', label: '👑 Master', desc: '1500+ rating' },
    { id: 'fairplay', label: '🤝 Fairplay', desc: 'Centilmen davranış' },
    { id: 'battle_champion', label: '🏆 Battle Şampiyonu', desc: 'Battle ligi şampiyonu' },
    { id: 'show_champion', label: '🎭 Show Şampiyonu', desc: 'Show ligi şampiyonu' },
  ];

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

  return (
    <div className="admin-panel">
      {/* Header */}
      <div className="admin-header">
        <button onClick={onBack} className="back-button">
          ← Geri
        </button>
        <h1>⚙️ Admin Panel</h1>
      </div>

      {/* Tab Navigation */}
      <div className="admin-tabs">
        <button 
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button 
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Kullanıcılar
        </button>
        <button 
          className={`tab-btn ${activeTab === 'battles' ? 'active' : ''}`}
          onClick={() => setActiveTab('battles')}
        >
          ⚔️ Battle'lar
        </button>
        <button 
          className={`tab-btn ${activeTab === 'badges' ? 'active' : ''}`}
          onClick={() => setActiveTab('badges')}
        >
          🏅 Rozetler
        </button>
        <button 
          className={`tab-btn ${activeTab === 'season' ? 'active' : ''}`}
          onClick={() => setActiveTab('season')}
        >
          🔄 Sezon
        </button>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="tab-content">
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-icon">👥</span>
              <div>
                <p className="stat-label">Toplam Kullanıcı</p>
                <p className="stat-value">{allUsers.length}</p>
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">⚔️</span>
              <div>
                <p className="stat-label">Toplam Battle</p>
                <p className="stat-value">{battles.length}</p>
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">⏳</span>
              <div>
                <p className="stat-label">Aktif Battle</p>
                <p className="stat-value">{battles.filter(b => ['CONFIRMED', 'BATTLE_SCHEDULED'].includes(b.status)).length}</p>
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">✅</span>
              <div>
                <p className="stat-label">Tamamlanan</p>
                <p className="stat-value">{battles.filter(b => b.status === 'COMPLETED').length}</p>
              </div>
            </div>
          </div>

          <h2 style={{ marginTop: '30px' }}>🎯 Hakem Atama</h2>
          <div className="battles-list">
            {battles.filter(b => b.status === 'CONFIRMED' && !b.refereeId).map(battle => (
              <div key={battle.id} className="battle-card">
                <div className="battle-info">
                  <h3>{battle.challenger?.name} vs {battle.opponent?.name}</h3>
                  <p>{battle.studio?.name} • {new Date(battle.scheduledFor).toLocaleDateString('tr-TR')}</p>
                </div>
                <select 
                  value="" 
                  onChange={(e) => handleAssignReferee(battle.id, e.target.value)}
                  disabled={assigningReferee === battle.id}
                >
                  <option value="">Hakem Seç...</option>
                  {referees.map(ref => (
                    <option key={ref.id} value={ref.id}>{ref.name}</option>
                  ))}
                </select>
              </div>
            ))}
            {battles.filter(b => b.status === 'CONFIRMED' && !b.refereeId).length === 0 && (
              <p style={{ textAlign: 'center', color: '#6b7280' }}>Hakem bekleyen battle yok</p>
            )}
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="tab-content">
          <h2>👥 Kullanıcı Yönetimi</h2>
          {allUsers.length === 0 ? (
            <div className="empty-state">
              <p>Kullanıcı bulunamadı veya yükleniyor...</p>
            </div>
          ) : (
            <div className="users-list">
              {allUsers.map(user => (
              <div key={user.id} className="user-card">
                <div className="user-info">
                  <img src={user.avatar || '/default-avatar.png'} alt={user.name} />
                  <div>
                    <h3>{user.name}</h3>
                    <p>{user.email}</p>
                    <div className="user-badges">
                      {user.badges?.map(badge => <span key={badge} className="badge-mini">{badge}</span>)}
                    </div>
                  </div>
                </div>
                <div className="user-actions">
                  <select 
                    value={user.role} 
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  >
                    <option value="DANCER">DANCER</option>
                    <option value="REFEREE">REFEREE</option>
                    <option value="INSTRUCTOR">INSTRUCTOR</option>
                    <option value="STUDIO">STUDIO</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                  <button 
                    onClick={() => handleToggleActive(user.id, user.isActive)}
                    className={user.isActive ? 'btn-warning' : 'btn-success'}
                  >
                    {user.isActive ? '🔴 Pasif Yap' : '🟢 Aktif Yap'}
                  </button>
                  <button 
                    onClick={() => setBadgeModal({ open: true, user })}
                    className="btn-primary"
                  >
                    🏅 Rozet
                  </button>
                  <button 
                    onClick={() => handleDeleteUser(user.id)}
                    className="btn-danger"
                  >
                    🗑️ Sil
                  </button>
                </div>
              </div>
            ))}
            </div>
          )}
        </div>
      )}

      {/* Battles Tab */}
      {activeTab === 'battles' && (
        <div className="tab-content">
          <h2>⚔️ Battle Yönetimi</h2>
          {battles.length === 0 ? (
            <div className="empty-state">
              <p>Battle bulunamadı</p>
            </div>
          ) : (
            <div className="battles-list">
              {battles.map(battle => {
              const statusBadge = getStatusBadge(battle.status);
              return (
                <div key={battle.id} className="battle-card">
                  <div className="battle-info">
                    <h3>{battle.challenger?.name} vs {battle.opponent?.name}</h3>
                    <p>{battle.studio?.name} • {new Date(battle.scheduledFor).toLocaleDateString('tr-TR')}</p>
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: statusBadge.bg, color: statusBadge.color }}
                    >
                      {statusBadge.label}
                    </span>
                  </div>
                  <div className="battle-actions">
                    <button 
                      onClick={() => handleDeleteBattle(battle.id)}
                      className="btn-danger"
                    >
                      ❌ İptal Et
                    </button>
                  </div>
                </div>
              );
            })}
            </div>
          )}
        </div>
      )}

      {/* Badges Tab */}
      {activeTab === 'badges' && (
        <div className="tab-content">
          <h2>🏅 Rozet Sistemi</h2>
          
          {/* Kullanıcı Arama ve Rozet Ekleme */}
          <div className="badge-assign-section">
            <h3>🔍 Kullanıcıya Rozet Ekle</h3>
            <div className="search-assign-container">
              <input
                type="text"
                placeholder="Kullanıcı adı veya email ara..."
                className="user-search-input"
                onChange={(e) => {
                  const searchTerm = e.target.value.toLowerCase();
                  const filtered = allUsers.filter(u => 
                    u.name.toLowerCase().includes(searchTerm) || 
                    u.email.toLowerCase().includes(searchTerm)
                  );
                  // Filtrelenmiş kullanıcıları göster
                  const dropdown = document.getElementById('user-dropdown');
                  if (dropdown) {
                    dropdown.innerHTML = filtered.slice(0, 5).map(u => `
                      <div class="user-dropdown-item" data-userid="${u.id}">
                        <img src="${u.avatar || '/default-avatar.png'}" alt="${u.name}" />
                        <div>
                          <strong>${u.name}</strong>
                          <span>${u.email}</span>
                        </div>
                      </div>
                    `).join('');
                    dropdown.style.display = filtered.length > 0 ? 'block' : 'none';
                    
                    // Click event ekle
                    dropdown.querySelectorAll('.user-dropdown-item').forEach(item => {
                      item.onclick = () => {
                        const userId = item.getAttribute('data-userid');
                        const user = allUsers.find(u => u.id === userId);
                        if (user) {
                          setBadgeModal({ open: true, user });
                          dropdown.style.display = 'none';
                          e.target.value = '';
                        }
                      };
                    });
                  }
                }}
              />
              <div id="user-dropdown" className="user-dropdown"></div>
            </div>
          </div>

          {/* Tüm Rozetler */}
          <h3 style={{ marginTop: '30px' }}>📋 Tüm Rozetler</h3>
          <div className="badges-grid">
            {availableBadges.map(badge => (
              <div key={badge.id} className="badge-item">
                <h3>{badge.label}</h3>
                <p>{badge.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Season Tab */}
      {activeTab === 'season' && (
        <div className="tab-content">
          <h2>🔄 Sezon Sıfırlama</h2>
          <div className="season-options">
            <div className="season-card">
              <h3>🔄 Tam Sıfırlama</h3>
              <p>Tüm dansçılar 1200 puana sıfırlanır</p>
              <button onClick={() => handleSeasonReset('full')} className="btn-danger">
                Tam Sıfırla
              </button>
            </div>
            <div className="season-card">
              <h3>📈 %20 Taşıma</h3>
              <p>1200 + (eski_puan × 0.20) hesaplanır</p>
              <button onClick={() => handleSeasonReset('carry20')} className="btn-primary">
                %20 ile Sıfırla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Badge Modal */}
      {badgeModal.open && (
        <div className="modal-overlay" onClick={() => setBadgeModal({ open: false, user: null })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>🏅 {badgeModal.user?.name} için Rozet Yönetimi</h2>
            <div className="current-badges">
              <h3>Mevcut Rozetler:</h3>
              {badgeModal.user?.badges?.map(badge => (
                <div key={badge} className="badge-row">
                  <span>{availableBadges.find(b => b.id === badge)?.label || badge}</span>
                  <button onClick={() => handleRemoveBadge(badgeModal.user.id, badge)} className="btn-danger-sm">
                    Kaldır
                  </button>
                </div>
              ))}
              {(!badgeModal.user?.badges || badgeModal.user.badges.length === 0) && (
                <p style={{ color: '#6b7280' }}>Henüz rozet yok</p>
              )}
            </div>
            <div className="available-badges">
              <h3>Eklenebilir Rozetler:</h3>
              {availableBadges
                .filter(b => !badgeModal.user?.badges?.includes(b.id))
                .map(badge => (
                  <div key={badge.id} className="badge-row">
                    <span>{badge.label} - {badge.desc}</span>
                    <button onClick={() => handleAssignBadge(badgeModal.user.id, badge.id)} className="btn-success-sm">
                      Ekle
                    </button>
                  </div>
                ))}
            </div>
            <button onClick={() => setBadgeModal({ open: false, user: null })} className="btn-secondary">
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
