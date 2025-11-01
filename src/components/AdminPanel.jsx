"use client";

import React, { useState, useEffect } from "react";
import { battlesApi, authApi } from "@/lib/api-client";
import "./AdminPanel.css";

const AdminPanel = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState("stats");
  const [battles, setBattles] = useState([]);
  const [referees, setReferees] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assigningReferee, setAssigningReferee] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [period, setPeriod] = useState("week");
  
  // Users tab state
  const [users, setUsers] = useState([]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersSearch, setUsersSearch] = useState("");
  const [usersSearchInput, setUsersSearchInput] = useState(""); // For debounce
  const [usersRoleFilter, setUsersRoleFilter] = useState("all");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showModal, setShowModal] = useState(null); // "role", "rating", "profile", "badges", "notification", "delete", "bulkNotification", "bulkBadge"
  const [modalData, setModalData] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  const currentUser = authApi.getCurrentUser();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setUsersSearch(usersSearchInput);
      setUsersPage(1);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [usersSearchInput]);

  useEffect(() => {
    if (currentUser?.role !== "ADMIN") {
      alert("Bu sayfaya erişim yetkiniz yok!");
      onBack();
      return;
    }
    loadData();
  }, [activeTab, period, usersPage, usersSearch, usersRoleFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      
      if (activeTab === "stats") {
        const statsResponse = await fetch(`/api/admin/stats?period=${period}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        
        if (statsResponse.ok) {
          const data = await statsResponse.json();
          setStats(data.data);
        }
      } else if (activeTab === "battles") {
        const battlesResponse = await battlesApi.getBattles();
        setBattles(battlesResponse.data || []);

        const usersResponse = await fetch("/api/users?role=REFEREE", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        
        if (usersResponse.ok) {
          const data = await usersResponse.json();
          setReferees(data.data || []);
        }
      } else if (activeTab === "users") {
        const params = new URLSearchParams({
          page: usersPage.toString(),
          limit: "20",
          ...(usersSearch && { search: usersSearch }),
          ...(usersRoleFilter !== "all" && { role: usersRoleFilter })
        });

        const usersResponse = await fetch(`/api/admin/users?${params}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        
        if (usersResponse.ok) {
          const data = await usersResponse.json();
          setUsers(data.data.users || []);
          setUsersTotal(data.data.total || 0);
        }
      }

      console.log("✅ Admin panel verileri yüklendi");
    } catch (err) {
      console.error("❌ Admin panel yükleme hatası:", err);
      alert("Veriler yüklenemedi: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignReferee = async (battleId, refereeId) => {
    try {
      setAssigningReferee(battleId);
      
      await battlesApi.updateBattle(battleId, {
        action: "ASSIGN_REFEREE",
        refereeId: refereeId
      });

      alert("✅ Hakem başarıyla atandı!");
      await loadData();
    } catch (err) {
      console.error("❌ Hakem atama hatası:", err);
      alert("Hakem atanamadı: " + err.message);
    } finally {
      setAssigningReferee(null);
    }
  };

  // User management handlers
  const handleUserAction = async (action, userId, payload) => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem("token");

      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ action, userId, ...payload })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "İşlem başarısız");
      }

      alert("✅ İşlem başarılı!");
      setShowModal(null);
      setModalData(null);
      await loadData();
    } catch (err) {
      console.error("❌ İşlem hatası:", err);
      alert("Hata: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkAction = async (action, payload) => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem("token");

      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ action, ...payload })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "İşlem başarısız");
      }

      alert("✅ Toplu işlem başarılı!");
      setShowModal(null);
      setSelectedUsers([]);
      await loadData();
    } catch (err) {
      console.error("❌ Toplu işlem hatası:", err);
      alert("Hata: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const openModal = (type, user = null) => {
    setShowModal(type);
    setModalData(user);
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: { label: "Beklemede", color: "#f59e0b", bg: "rgba(245,158,11,0.2)" },
      CHALLENGER_ACCEPTED: { label: "Kabul Edildi", color: "#10b981", bg: "rgba(16,185,129,0.2)" },
      STUDIO_PENDING: { label: "Stüdyo Bekliyor", color: "#6366f1", bg: "rgba(99,102,241,0.2)" },
      CONFIRMED: { label: "Onaylandı", color: "#10b981", bg: "rgba(16,185,129,0.2)" },
      BATTLE_SCHEDULED: { label: "Planlandı", color: "#8b5cf6", bg: "rgba(139,92,246,0.2)" }
    };
    return badges[status] || { label: status, color: "#6b7280", bg: "rgba(107,114,128,0.2)" };
  };

  if (loading) {
    return (
      <div className="admin-panel-root">
        <div className="loading">
          <div className="spinner"></div>
          <p>Admin panel yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-panel-root">
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

      <div className="admin-nav">
        <button 
          className={`nav-tab ${activeTab === "stats" ? "active" : ""}`}
          onClick={() => setActiveTab("stats")}
        >
          <span className="nav-icon">📊</span>
          <span>statistikler</span>
        </button>
        <button 
          className={`nav-tab ${activeTab === "battles" ? "active" : ""}`}
          onClick={() => setActiveTab("battles")}
        >
          <span className="nav-icon">⚔️</span>
          <span>Battle Yönetimi</span>
        </button>
        <button 
          className={`nav-tab ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          <span className="nav-icon">👥</span>
          <span>Kullanıcılar</span>
        </button>
        <button 
          className={`nav-tab ${activeTab === "badges" ? "active" : ""}`}
          onClick={() => setActiveTab("badges")}
        >
          <span className="nav-icon">🎖️</span>
          <span>Rozetler</span>
        </button>
        <button 
          className={`nav-tab ${activeTab === "notifications" ? "active" : ""}`}
          onClick={() => setActiveTab("notifications")}
        >
          <span className="nav-icon">📢</span>
          <span>Bildirimler</span>
        </button>
      </div>

      <div className="admin-content">
        {activeTab === "stats" && stats && (
          <div className="stats-tab">
            <div className="period-selector">
              {["day", "week", "month", "year", "all"].map((p) => (
                <button
                  key={p}
                  className={`period-btn ${period === p ? "active" : ""}`}
                  onClick={() => setPeriod(p)}
                >
                  {p === "day" ? "Bugün" : p === "week" ? "Bu Hafta" : p === "month" ? "Bu Ay" : p === "year" ? "Bu Yıl" : "Tümü"}
                </button>
              ))}
            </div>

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

            <div className="charts-row">
              <div className="chart-card">
                <h3>📊 Günlük Battle Trendi</h3>
                <div className="chart-container">
                  <div className="bar-chart">
                    {stats.trends.dailyBattles.map((day, i) => {
                      const max = Math.max(...stats.trends.dailyBattles.map(d => d.count));
                      const height = max > 0 ? (day.count / max) * 100 : 0;
                      return (
                        <div key={i} className="bar-item">
                          <div className="bar-wrapper">
                            <div className="bar" style={{ height: `${height}%` }} title={`${day.count} battle`}>
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

              <div className="chart-card">
                <h3>👥 Günlük Kayıt Trendi</h3>
                <div className="chart-container">
                  <div className="bar-chart">
                    {stats.trends.dailyUsers.map((day, i) => {
                      const max = Math.max(...stats.trends.dailyUsers.map(d => d.count));
                      const height = max > 0 ? (day.count / max) * 100 : 0;
                      return (
                        <div key={i} className="bar-item">
                          <div className="bar-wrapper">
                            <div className="bar bar-user" style={{ height: `${height}%` }} title={`${day.count} kullanıcı`}>
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

            <div className="section-card">
              <h3>🏆 En Aktif Dansçılar</h3>
              <div className="top-dancers-list">
                {stats.users.topDancers.slice(0, 5).map((dancer, i) => (
                  <div key={dancer.id} className="dancer-item">
                    <div className="dancer-rank">#{i + 1}</div>
                    <div className="dancer-avatar">
                      {dancer.avatar ? (
                        <img src={dancer.avatar} alt={dancer.name} />
                      ) : (
                        <div className="avatar-placeholder">{dancer.name.charAt(0)}</div>
                      )}
                    </div>
                    <div className="dancer-info">
                      <div className="dancer-name">{dancer.name}</div>
                      <div className="dancer-styles">{dancer.danceStyles.join(", ")}</div>
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

            <div className="section-card">
              <h3>🏢 En Popüler Stüdyolar</h3>
              <div className="top-studios-grid">
                {stats.battles.topStudios.map((studio, i) => (
                  <div key={studio.id} className="studio-card-small">
                    <div className="studio-rank">#{i + 1}</div>
                    <div className="studio-icon">🏢</div>
                    <div className="studio-name">{studio.name}</div>
                    <div className="studio-location">{studio.city}</div>
                    <div className="studio-battles">{studio._count.battleRequests} battle</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "battles" && (
          <div className="battles-management">
            {referees.length === 0 && (
              <div className="alert alert-warning">
                <div className="alert-icon">⚠️</div>
                <div className="alert-content">
                  <strong>Dikkat!</strong> Sistemde kayıtlı hakem bulunmuyor.
                </div>
              </div>
            )}

            <div className="section-header">
              <h2>⚔️ Battle Yönetimi</h2>
              <div className="filter-tabs">
                <button className={`filter-tab ${filterStatus === "all" ? "active" : ""}`} onClick={() => setFilterStatus("all")}>
                  Tümü
                </button>
                <button className={`filter-tab ${filterStatus === "needsReferee" ? "active" : ""}`} onClick={() => setFilterStatus("needsReferee")}>
                  Hakem Bekliyor
                </button>
                <button className={`filter-tab ${filterStatus === "assigned" ? "active" : ""}`} onClick={() => setFilterStatus("assigned")}>
                  Atanmış
                </button>
              </div>
            </div>

            {battles.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <h3>Battle bulunamadı</h3>
              </div>
            ) : (
              <div className="battles-grid">
                {battles.filter(b => ['CONFIRMED', 'BATTLE_SCHEDULED'].includes(b.status)).map(battle => {
                  const badge = getStatusBadge(battle.status);
                  const isAssigning = assigningReferee === battle.id;
                  return (
                    <div key={battle.id} className={`battle-card ${isAssigning ? "expanded" : ""}`}>
                      <div className="battle-card-header">
                        <div className="battle-title-section">
                          <h3 className="battle-title">{battle.title || "Battle"}</h3>
                          <span className="battle-category">🎵 {battle.category || "Hip-Hop"}</span>
                        </div>
                        <span className="status-badge" style={{ background: badge.bg, color: badge.color }}>
                          {badge.label}
                        </span>
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
                            <button className="btn-secondary" onClick={() => setAssigningReferee(isAssigning ? null : battle.id)}>
                              {isAssigning ? "İptal" : "Değiştir"}
                            </button>
                          </div>
                        ) : (
                          <div className="referee-needed">
                            <div className="warning-indicator">
                              <span className="warning-icon">⚠️</span>
                              <span className="warning-text">Hakem atanmadı</span>
                            </div>
                            <button className="btn-primary" onClick={() => setAssigningReferee(isAssigning ? null : battle.id)} disabled={referees.length === 0}>
                              {isAssigning ? "İptal" : "🎯 Hakem Ata"}
                            </button>
                          </div>
                        )}
                      </div>

                      {isAssigning && (
                        <div className="referee-selector">
                          <div className="selector-header">
                            <h4>Hakem Seçin</h4>
                          </div>
                          <div className="referees-list">
                            {referees.map(referee => (
                              <div
                                key={referee.id}
                                className={`referee-option ${battle.referee?.id === referee.id ? "selected" : ""}`}
                                onClick={() => handleAssignReferee(battle.id, referee.id)}
                              >
                                <div className="referee-option-avatar">⚖️</div>
                                <div className="referee-option-info">
                                  <div className="referee-option-name">{referee.name}</div>
                                  <div className="referee-option-email">{referee.email}</div>
                                </div>
                                {battle.referee?.id === referee.id && <div className="selected-badge">✓ Mevcut</div>}
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
        )}

        {activeTab === "users" && (
          <div className="users-management">
            <div className="section-header">
              <h2>👥 Kullanıcı Yönetimi</h2>
              <div className="users-controls">
                <input
                  type="text"
                  className="search-input"
                  placeholder="🔍 Kullanıcı ara... (Yazmayı bitirince arar)"
                  value={usersSearchInput}
                  onChange={(e) => setUsersSearchInput(e.target.value)}
                />
                <select
                  className="role-filter"
                  value={usersRoleFilter}
                  onChange={(e) => {
                    setUsersRoleFilter(e.target.value);
                    setUsersPage(1);
                  }}
                >
                  <option value="all">Tüm Roller</option>
                  <option value="DANCER">Dansçı</option>
                  <option value="INSTRUCTOR">Eğitmen</option>
                  <option value="STUDIO">Stüdyo</option>
                  <option value="REFEREE">Hakem</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>

            {selectedUsers.length > 0 && (
              <div className="bulk-actions-bar">
                <div className="bulk-info">
                  <span className="bulk-count">{selectedUsers.length} kullanıcı seçildi</span>
                  <button className="btn-link" onClick={() => setSelectedUsers([])}>Seçimi Temizle</button>
                </div>
                <div className="bulk-buttons">
                  <button className="btn-secondary" onClick={() => openModal("bulkNotification")}>
                    📢 Toplu Bildirim
                  </button>
                  <button className="btn-primary" onClick={() => openModal("bulkBadge")}>
                    🎖️ Toplu Rozet
                  </button>
                </div>
              </div>
            )}

            {users.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <h3>Kullanıcı bulunamadı</h3>
              </div>
            ) : (
              <div className="users-table-container">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          checked={users.length > 0 && selectedUsers.length === users.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers(users.map(u => u.id));
                            } else {
                              setSelectedUsers([]);
                            }
                          }}
                        />
                      </th>
                      <th>Kullanıcı</th>
                      <th>Rol</th>
                      <th>Rating</th>
                      <th>Rozetler</th>
                      <th>Kayıt</th>
                      <th>İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id} className={selectedUsers.includes(user.id) ? "selected" : ""}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => toggleUserSelection(user.id)}
                          />
                        </td>
                        <td>
                          <div className="user-cell">
                            <div className="user-avatar">{user.name?.charAt(0) || "?"}</div>
                            <div className="user-info">
                              <div className="user-name">{user.name || "İsimsiz"}</div>
                              <div className="user-email">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`role-badge role-${user.role?.toLowerCase()}`}>
                            {user.role === "DANCER" ? "🕺 Dansçı" :
                             user.role === "INSTRUCTOR" ? "👨‍🏫 Eğitmen" :
                             user.role === "STUDIO" ? "🏢 Stüdyo" :
                             user.role === "REFEREE" ? "⚖️ Hakem" :
                             user.role === "ADMIN" ? "⚡ Admin" : user.role}
                          </span>
                        </td>
                        <td>
                          <span className="rating-value">{user.rating || 1000}</span>
                        </td>
                        <td>
                          <div className="badges-cell">
                            {user.badges && user.badges.length > 0 ? (
                              user.badges.slice(0, 3).map((badge, idx) => (
                                <span key={idx} className="mini-badge">{badge}</span>
                              ))
                            ) : (
                              <span className="no-badges">-</span>
                            )}
                            {user.badges && user.badges.length > 3 && (
                              <span className="more-badges">+{user.badges.length - 3}</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="date-text">
                            {new Date(user.createdAt).toLocaleDateString("tr-TR")}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="action-btn action-role"
                              onClick={() => openModal("role", user)}
                              title="Rol Değiştir"
                            >
                              🔄
                            </button>
                            <button
                              className="action-btn action-rating"
                              onClick={() => openModal("rating", user)}
                              title="Rating Düzenle"
                            >
                              ⭐
                            </button>
                            <button
                              className="action-btn action-profile"
                              onClick={() => openModal("profile", user)}
                              title="Profil Düzenle"
                            >
                              ✏️
                            </button>
                            <button
                              className="action-btn action-badges"
                              onClick={() => openModal("badges", user)}
                              title="Rozetler"
                            >
                              🎖️
                            </button>
                            <button
                              className="action-btn action-notification"
                              onClick={() => openModal("notification", user)}
                              title="Bildirim Gönder"
                            >
                              📧
                            </button>
                            <button
                              className="action-btn action-delete"
                              onClick={() => openModal("delete", user)}
                              title="Sil"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {usersTotal > 20 && (
              <div className="pagination">
                <button
                  className="pagination-btn"
                  disabled={usersPage === 1}
                  onClick={() => setUsersPage(p => p - 1)}
                >
                  ← Önceki
                </button>
                <span className="pagination-info">
                  Sayfa {usersPage} / {Math.ceil(usersTotal / 20)}
                </span>
                <button
                  className="pagination-btn"
                  disabled={usersPage >= Math.ceil(usersTotal / 20)}
                  onClick={() => setUsersPage(p => p + 1)}
                >
                  Sonraki →
                </button>
              </div>
            )}
          </div>
        )}

        {!["stats", "battles", "users"].includes(activeTab) && (
          <div className="coming-soon">
            <div className="coming-soon-icon">🚧</div>
            <h3>Yakında Gelecek</h3>
            <p>Bu özellik üzerinde çalışıyoruz...</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showModal === "role" && modalData && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🔄 Rol Değiştir</h3>
              <button className="modal-close" onClick={() => setShowModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <p><strong>{modalData.name}</strong> için yeni rol seçin:</p>
              <select
                className="modal-select"
                defaultValue={modalData.role}
                id="newRole"
              >
                <option value="DANCER">🕺 Dansçı</option>
                <option value="INSTRUCTOR">👨‍🏫 Eğitmen</option>
                <option value="STUDIO">🏢 Stüdyo</option>
                <option value="REFEREE">⚖️ Hakem</option>
                <option value="ADMIN">⚡ Admin</option>
              </select>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(null)}>İptal</button>
              <button
                className="btn-primary"
                disabled={actionLoading}
                onClick={() => {
                  const newRole = document.getElementById("newRole").value;
                  handleUserAction("UPDATE_ROLE", modalData.id, { role: newRole });
                }}
              >
                {actionLoading ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal === "rating" && modalData && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⭐ Rating Düzenle</h3>
              <button className="modal-close" onClick={() => setShowModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <p><strong>{modalData.name}</strong> için yeni rating:</p>
              <input
                type="number"
                className="modal-input"
                defaultValue={modalData.rating || 1000}
                id="newRating"
                min="0"
                max="3000"
              />
              <small className="input-hint">ELO rating sistemi (0-3000 arası)</small>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(null)}>İptal</button>
              <button
                className="btn-primary"
                disabled={actionLoading}
                onClick={() => {
                  const newRating = parseInt(document.getElementById("newRating").value);
                  handleUserAction("UPDATE_RATING", modalData.id, { rating: newRating });
                }}
              >
                {actionLoading ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal === "profile" && modalData && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✏️ Profil Düzenle</h3>
              <button className="modal-close" onClick={() => setShowModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Bio</label>
                <textarea
                  className="modal-textarea"
                  defaultValue={modalData.bio || ""}
                  id="newBio"
                  rows="3"
                  placeholder="Kısa biyografi..."
                />
              </div>
              <div className="form-group">
                <label>Dans Stilleri (virgülle ayırın)</label>
                <input
                  type="text"
                  className="modal-input"
                  defaultValue={modalData.danceStyles?.join(", ") || ""}
                  id="newDanceStyles"
                  placeholder="Hip-Hop, Breaking, Popping..."
                />
              </div>
              <div className="form-group">
                <label>Deneyim Yılı</label>
                <input
                  type="number"
                  className="modal-input"
                  defaultValue={modalData.experienceYears || 0}
                  id="newExperience"
                  min="0"
                  max="50"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(null)}>İptal</button>
              <button
                className="btn-primary"
                disabled={actionLoading}
                onClick={() => {
                  const bio = document.getElementById("newBio").value;
                  const danceStylesStr = document.getElementById("newDanceStyles").value;
                  const danceStyles = danceStylesStr ? danceStylesStr.split(",").map(s => s.trim()).filter(Boolean) : [];
                  const experienceYears = parseInt(document.getElementById("newExperience").value);
                  handleUserAction("UPDATE_PROFILE", modalData.id, { bio, danceStyles, experienceYears });
                }}
              >
                {actionLoading ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal === "badges" && modalData && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🎖️ Rozet Yönetimi</h3>
              <button className="modal-close" onClick={() => setShowModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <p><strong>{modalData.name}</strong> mevcut rozetleri:</p>
              <div className="badges-list">
                {modalData.badges && modalData.badges.length > 0 ? (
                  modalData.badges.map((badge, idx) => (
                    <div key={idx} className="badge-item">
                      <span className="badge-name">{badge}</span>
                      <button
                        className="badge-remove"
                        onClick={() => handleUserAction("REMOVE_BADGE", modalData.id, { badge })}
                        disabled={actionLoading}
                      >
                        ×
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="no-data">Henüz rozet yok</p>
                )}
              </div>
              <div className="form-group" style={{ marginTop: "20px" }}>
                <label>Yeni Rozet Ekle</label>
                <input
                  type="text"
                  className="modal-input"
                  id="newBadge"
                  placeholder="🏆 Champion, 🔥 Fire Dancer..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(null)}>Kapat</button>
              <button
                className="btn-primary"
                disabled={actionLoading}
                onClick={() => {
                  const badge = document.getElementById("newBadge").value.trim();
                  if (badge) {
                    handleUserAction("ADD_BADGE", modalData.id, { badge });
                    document.getElementById("newBadge").value = "";
                  }
                }}
              >
                {actionLoading ? "Ekleniyor..." : "Rozet Ekle"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal === "notification" && modalData && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📧 Bildirim Gönder</h3>
              <button className="modal-close" onClick={() => setShowModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <p><strong>{modalData.name}</strong> kullanıcısına bildirim:</p>
              <div className="form-group">
                <label>Başlık</label>
                <input
                  type="text"
                  className="modal-input"
                  id="notifTitle"
                  placeholder="Bildirim başlığı..."
                />
              </div>
              <div className="form-group">
                <label>Mesaj</label>
                <textarea
                  className="modal-textarea"
                  id="notifMessage"
                  rows="4"
                  placeholder="Bildirim mesajı..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(null)}>İptal</button>
              <button
                className="btn-primary"
                disabled={actionLoading}
                onClick={() => {
                  const title = document.getElementById("notifTitle").value.trim();
                  const message = document.getElementById("notifMessage").value.trim();
                  if (title && message) {
                    handleUserAction("SEND_NOTIFICATION", modalData.id, { title, message });
                  } else {
                    alert("Başlık ve mesaj gereklidir!");
                  }
                }}
              >
                {actionLoading ? "Gönderiliyor..." : "Gönder"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal === "delete" && modalData && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal-content modal-danger" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🗑️ Kullanıcı Sil</h3>
              <button className="modal-close" onClick={() => setShowModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="warning-box">
                <div className="warning-icon">⚠️</div>
                <p><strong>DİKKAT!</strong> Bu işlem geri alınamaz.</p>
              </div>
              <p>
                <strong>{modalData.name}</strong> ({modalData.email}) kullanıcısını silmek istediğinizden emin misiniz?
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(null)}>İptal</button>
              <button
                className="btn-danger"
                disabled={actionLoading}
                onClick={() => handleUserAction("DELETE_USER", modalData.id, {})}
              >
                {actionLoading ? "Siliniyor..." : "Evet, Sil"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal === "bulkNotification" && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📢 Toplu Bildirim</h3>
              <button className="modal-close" onClick={() => setShowModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <p><strong>{selectedUsers.length} kullanıcıya</strong> bildirim gönderilecek:</p>
              <div className="form-group">
                <label>Başlık</label>
                <input
                  type="text"
                  className="modal-input"
                  id="bulkNotifTitle"
                  placeholder="Bildirim başlığı..."
                />
              </div>
              <div className="form-group">
                <label>Mesaj</label>
                <textarea
                  className="modal-textarea"
                  id="bulkNotifMessage"
                  rows="4"
                  placeholder="Bildirim mesajı..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(null)}>İptal</button>
              <button
                className="btn-primary"
                disabled={actionLoading}
                onClick={() => {
                  const title = document.getElementById("bulkNotifTitle").value.trim();
                  const message = document.getElementById("bulkNotifMessage").value.trim();
                  if (title && message) {
                    handleBulkAction("BULK_NOTIFICATION", { userIds: selectedUsers, title, message });
                  } else {
                    alert("Başlık ve mesaj gereklidir!");
                  }
                }}
              >
                {actionLoading ? "Gönderiliyor..." : `${selectedUsers.length} Kişiye Gönder`}
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal === "bulkBadge" && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🎖️ Toplu Rozet Ekle</h3>
              <button className="modal-close" onClick={() => setShowModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <p><strong>{selectedUsers.length} kullanıcıya</strong> rozet eklenecek:</p>
              <div className="form-group">
                <label>Rozet</label>
                <input
                  type="text"
                  className="modal-input"
                  id="bulkBadge"
                  placeholder="🏆 Champion, 🔥 Fire Dancer..."
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(null)}>İptal</button>
              <button
                className="btn-primary"
                disabled={actionLoading}
                onClick={() => {
                  const badge = document.getElementById("bulkBadge").value.trim();
                  if (badge) {
                    handleBulkAction("BULK_ADD_BADGE", { userIds: selectedUsers, badge });
                  } else {
                    alert("Rozet giriniz!");
                  }
                }}
              >
                {actionLoading ? "Ekleniyor..." : `${selectedUsers.length} Kişiye Ekle`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
