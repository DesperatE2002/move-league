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
  const currentUser = authApi.getCurrentUser();

  useEffect(() => {
    if (currentUser?.role !== "ADMIN") {
      alert("Bu sayfaya erişim yetkiniz yok!");
      onBack();
      return;
    }
    loadData();
  }, [activeTab, period]);

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

        {!["stats", "battles"].includes(activeTab) && (
          <div className="coming-soon">
            <div className="coming-soon-icon">🚧</div>
            <h3>Yakında Gelecek</h3>
            <p>Bu özellik üzerinde çalışıyoruz...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
