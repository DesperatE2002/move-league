"use client";

import React, { useState, useEffect } from "react";
import { battlesApi, authApi } from "@/lib/api-client";
import "./AdminPanel.css";
import "./SeasonReset.css";

const AdminPanel = ({ onBack, onViewUserProfile }) => {
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
  const [showModal, setShowModal] = useState(null); // "role", "rating", "profile", "badges", "notification", "delete", "bulkNotification", "bulkBadge", "viewUser", "createBadge", "deleteBadge"
  const [modalData, setModalData] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Badges tab state
  const [allBadges, setAllBadges] = useState([]);
  const [badgesLoading, setBadgesLoading] = useState(false);
  
  // Season reset stats
  const [totalStats, setTotalStats] = useState({ totalUsers: 0, totalBattles: 0, averageRating: 1000 });
  
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
        const battlesData = battlesResponse?.data?.battles || battlesResponse?.battles || battlesResponse?.data || [];
        setBattles(battlesData);

        const usersResponse = await fetch("/api/users?role=REFEREE", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        
        if (usersResponse.ok) {
          const data = await usersResponse.json();
          // ✅ API pagination yapısına göre users array'ini al
          const refereesData = data.data?.users || data.users || data.data || data || [];
          setReferees(refereesData);
        }
      } else if (activeTab === "users") {
        const params = new URLSearchParams({
          page: usersPage.toString(),
          limit: "20",
          ...(usersSearch && { search: usersSearch }),
          ...(usersRoleFilter !== "all" && { role: usersRoleFilter })
        });

        console.log("🔍 Fetching users with params:", params.toString());
        
        const usersResponse = await fetch(`/api/admin/users?${params}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        
        console.log("📡 Users API response status:", usersResponse.status);
        
        if (usersResponse.ok) {
          const response = await usersResponse.json();
          console.log("📊 Users API full response:", response);
          
          if (response.success && response.data) {
            console.log("✅ Users array:", response.data.users);
            console.log("✅ Total users:", response.data.total);
            setUsers(response.data.users || []);
            setUsersTotal(response.data.total || 0);
          } else {
            console.error("❌ API response structure error:", response);
            setUsers([]);
            setUsersTotal(0);
          }
        } else {
          const errorData = await usersResponse.json();
          console.error("❌ Users API error:", errorData);
        }
      } else if (activeTab === "badges") {
        setBadgesLoading(true);
        const badgesResponse = await fetch("/api/admin/badges", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        
        if (badgesResponse.ok) {
          const response = await badgesResponse.json();
          if (response.success && response.data) {
            setAllBadges(response.data.badges || []);
          }
        }
        setBadgesLoading(false);
      } else if (activeTab === "season") {
        // Load total stats for season reset page
        const allStatsResponse = await fetch(`/api/admin/stats?period=all`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });
        
        if (allStatsResponse.ok) {
          const data = await allStatsResponse.json();
          setTotalStats({
            totalUsers: data.data?.totalUsers || 0,
            totalBattles: data.data?.totalBattles || 0,
            averageRating: data.data?.averageRating || 1000
          });
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

  const handleSeasonReset = async () => {
    const confirmText = prompt(
      "⚠️ DİKKAT! Bu işlem GERİ ALINAMAZ!\n\n" +
      "Lig sıfırlama işlemi:\n" +
      "• Tüm kullanıcıların rating'i 1000'e sıfırlanacak\n" +
      "• Tüm galibiyet/mağlubiyet kayıtları silinecek\n" +
      "• Tüm battle kayıtları silinecek\n" +
      "• Tüm bildirimler silinecek\n\n" +
      "Devam etmek için 'RESET' yazın:"
    );

    if (confirmText !== "RESET") {
      if (confirmText !== null) {
        alert("İşlem iptal edildi.");
      }
      return;
    }

    const doubleConfirm = confirm(
      "Son kez soruyorum: Tüm lig verilerini sıfırlamak istediğinize EMİN misiniz?"
    );

    if (!doubleConfirm) {
      alert("İşlem iptal edildi.");
      return;
    }

    try {
      setActionLoading(true);
      const token = localStorage.getItem("token");

      const response = await fetch("/api/admin/season-reset", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ confirmationText: "RESET" })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Sezon sıfırlama başarısız");
      }

      const result = await response.json();
      alert(
        `✅ ${result.message}\n\n` +
        `📊 Sıfırlanan veriler:\n` +
        `• ${result.data.resetUsers} kullanıcı\n` +
        `• ${result.data.deletedBattles} battle\n` +
        `• ${result.data.deletedNotifications} bildirim`
      );

      // Reload data
      await loadData();
    } catch (err) {
      console.error("❌ Sezon sıfırlama hatası:", err);
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

  const handleCreateBadge = async () => {
    const badgeName = document.getElementById("new-badge-name")?.value?.trim();
    
    if (!badgeName) {
      alert("Rozet adı gerekli!");
      return;
    }

    try {
      setActionLoading(true);
      const token = localStorage.getItem("token");

      const response = await fetch("/api/admin/badges", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ badgeName })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Rozet oluşturulamadı");
      }

      alert("✅ Rozet oluşturuldu!");
      setShowModal(null);
      await loadData();
    } catch (err) {
      console.error("❌ Rozet oluşturma hatası:", err);
      alert("Hata: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteBadge = async (badgeName) => {
    if (!confirm(`"${badgeName}" rozetini silmek istediğinize emin misiniz? Bu rozete sahip tüm kullanıcılardan kaldırılacak.`)) {
      return;
    }

    try {
      setActionLoading(true);
      const token = localStorage.getItem("token");

      const response = await fetch("/api/admin/badges", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ badgeName })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Rozet silinemedi");
      }

      const result = await response.json();
      alert(`✅ ${result.message}`);
      setShowModal(null);
      setModalData(null);
      await loadData();
    } catch (err) {
      console.error("❌ Rozet silme hatası:", err);
      alert("Hata: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendBroadcast = async () => {
    const title = document.getElementById("notif-title")?.value?.trim();
    const message = document.getElementById("notif-message")?.value?.trim();
    const target = document.getElementById("notif-target")?.value;
    const role = document.getElementById("notif-role")?.value;

    if (!title || !message) {
      alert("Başlık ve mesaj gerekli!");
      return;
    }

    // Hedef belirleme
    let userIds = [];
    if (target === "all") {
      // Tüm kullanıcılara gönder
      userIds = users.map(u => u.id);
      
      // Eğer sayfa bazlıysa tüm kullanıcıları çekmemiz gerek
      if (confirm("Tüm kullanıcılara bildirim göndermek istediğinize emin misiniz?")) {
        // Basitçe backend'e "all" gönderebiliriz veya tüm kullanıcıları çekebiliriz
        // Şimdilik mevcut sayfadaki kullanıcılar
      } else {
        return;
      }
    } else if (target === "role") {
      // Belirli role gönder
      userIds = users.filter(u => u.role === role).map(u => u.id);
      if (userIds.length === 0) {
        alert("Bu role sahip kullanıcı bulunamadı!");
        return;
      }
    }

    try {
      setActionLoading(true);
      await handleBulkAction("BULK_NOTIFICATION", {
        userIds,
        title,
        message
      });
      
      // Formu temizle
      document.getElementById("notif-title").value = "";
      document.getElementById("notif-message").value = "";
    } catch (err) {
      console.error("❌ Broadcast hatası:", err);
    } finally {
      setActionLoading(false);
    }
  };

  // Notification target değiştiğinde role selector'ı göster/gizle
  useEffect(() => {
    const targetSelect = document.getElementById("notif-target");
    const roleSelector = document.getElementById("role-selector");
    
    if (targetSelect && roleSelector) {
      const handleTargetChange = () => {
        roleSelector.style.display = targetSelect.value === "role" ? "block" : "none";
      };
      
      targetSelect.addEventListener("change", handleTargetChange);
      return () => targetSelect.removeEventListener("change", handleTargetChange);
    }
  }, [activeTab]);

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
        <button 
          className={`nav-tab ${activeTab === "season" ? "active" : ""}`}
          onClick={() => setActiveTab("season")}
        >
          <span className="nav-icon">🔄</span>
          <span>Sezon Sıfırlama</span>
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
                  <div className="stat-value-large">₺{stats.revenue?.commission?.total || 0}</div>
                  <div className="stat-label-large">Site Kazancı (15% Komisyon)</div>
                  {stats.revenue?.commission?.inPeriod > 0 && (
                    <div className="stat-change positive">+₺{stats.revenue.commission.inPeriod}</div>
                  )}
                  <div style={{ 
                    marginTop: '8px', 
                    fontSize: '11px', 
                    color: 'rgba(255,255,255,0.6)',
                    background: 'rgba(0,0,0,0.2)',
                    padding: '6px 10px',
                    borderRadius: '6px'
                  }}>
                    📊 Toplam Gelir: ₺{stats.revenue.total.toLocaleString()}
                    <br />
                    👨‍🏫 Eğitmen Payı: ₺{stats.revenue?.instructor?.total || 0}
                  </div>
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
                        <td 
                          onClick={() => onViewUserProfile ? onViewUserProfile(user) : openModal("viewUser", user)} 
                          style={{ cursor: "pointer" }}
                        >
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

        {activeTab === "badges" && (
          <div className="badges-management">
            <div className="section-header">
              <h2>🎖️ Rozet Yönetimi</h2>
              <button
                className="btn-create"
                onClick={() => setShowModal("createBadge")}
              >
                ➕ Yeni Rozet Oluştur
              </button>
            </div>

            {badgesLoading ? (
              <div className="loading-state">⏳ Rozetler yükleniyor...</div>
            ) : allBadges.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🎖️</div>
                <p>Henüz rozet oluşturulmamış</p>
                <button
                  className="btn-primary"
                  onClick={() => setShowModal("createBadge")}
                >
                  İlk Rozeti Oluştur
                </button>
              </div>
            ) : (
              <div className="badges-grid">
                {allBadges.map((badge) => (
                  <div key={badge.name} className="badge-card">
                    <div className="badge-card-header">
                      <div className="badge-icon">🎖️</div>
                      <h3>{badge.name}</h3>
                    </div>
                    <div className="badge-card-body">
                      <div className="badge-stat">
                        <span className="badge-stat-label">Kullanım:</span>
                        <span className="badge-stat-value">{badge.usageCount} kullanıcı</span>
                      </div>
                    </div>
                    <div className="badge-card-footer">
                      <button
                        className="btn-danger-sm"
                        onClick={() => openModal("deleteBadge", badge)}
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

        {activeTab === "notifications" && (
          <div className="notifications-management">
            <div className="section-header">
              <h2>📢 Toplu Bildirim Gönder</h2>
            </div>

            <div className="notification-form">
              <div className="form-group">
                <label>📋 Başlık</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Bildirim başlığı..."
                  id="notif-title"
                />
              </div>

              <div className="form-group">
                <label>✉️ Mesaj</label>
                <textarea
                  className="form-textarea"
                  placeholder="Bildirim mesajı..."
                  rows="4"
                  id="notif-message"
                />
              </div>

              <div className="form-group">
                <label>👥 Hedef</label>
                <select className="form-select" id="notif-target">
                  <option value="all">Tüm Kullanıcılar</option>
                  <option value="role">Belirli Rol</option>
                </select>
              </div>

              <div className="form-group" id="role-selector" style={{ display: "none" }}>
                <label>🎭 Rol Seçin</label>
                <select className="form-select" id="notif-role">
                  <option value="DANCER">🕺 Dansçı</option>
                  <option value="INSTRUCTOR">👨‍🏫 Eğitmen</option>
                  <option value="STUDIO">🏢 Stüdyo</option>
                  <option value="REFEREE">⚖️ Hakem</option>
                  <option value="ADMIN">⚡ Admin</option>
                </select>
              </div>

              <button
                className="btn-primary btn-large"
                onClick={handleSendBroadcast}
              >
                📤 Bildirimi Gönder
              </button>
            </div>
          </div>
        )}

        {activeTab === "season" && (
          <div className="season-reset-management">
            <div className="section-header">
              <h2>🔄 Sezon Sıfırlama</h2>
            </div>

            <div className="danger-zone">
              <div className="danger-warning">
                <div className="warning-icon">⚠️</div>
                <div className="warning-content">
                  <h3>Tehlikeli Alan</h3>
                  <p>Bu işlem geri alınamaz! Lütfen dikkatli olun.</p>
                </div>
              </div>

              <div className="reset-info">
                <h4>🔄 Sezon Sıfırlama İşlemi:</h4>
                <ul className="reset-effects">
                  <li>✅ Tüm kullanıcıların rating'i <strong>1000</strong>'e sıfırlanacak</li>
                  <li>✅ Tüm galibiyet/mağlubiyet kayıtları <strong>0</strong>'a dönecek</li>
                  <li>✅ Tüm battle kayıtları <strong>silinecek</strong></li>
                  <li>✅ Tüm bildirimler <strong>temizlenecek</strong></li>
                  <li>✅ Kullanıcılara yeni sezon bildirimi <strong>gönderilecek</strong></li>
                  <li>⚠️ Rozetler ve kullanıcı hesapları <strong>korunacak</strong></li>
                </ul>
              </div>

              <div className="reset-stats">
                <h4>📊 Mevcut Durum:</h4>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-content">
                      <div className="stat-label">Toplam Kullanıcı</div>
                      <div className="stat-value">{totalStats.totalUsers}</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">⚔️</div>
                    <div className="stat-content">
                      <div className="stat-label">Toplam Battle</div>
                      <div className="stat-value">{totalStats.totalBattles}</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon">📊</div>
                    <div className="stat-content">
                      <div className="stat-label">Ortalama Rating</div>
                      <div className="stat-value">{totalStats.averageRating.toFixed(0)}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="reset-action">
                <button
                  className="btn-danger-large"
                  onClick={handleSeasonReset}
                  disabled={actionLoading}
                >
                  {actionLoading ? "⏳ İşlem devam ediyor..." : "🔄 Sezonu Sıfırla"}
                </button>
                <p className="reset-disclaimer">
                  Bu butona tıkladığınızda size onay mesajları gösterilecektir.
                </p>
              </div>
            </div>
          </div>
        )}

        {!["stats", "battles", "users", "badges", "notifications", "season"].includes(activeTab) && (
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
                  placeholder="SALSA, BACHATA, HİPHOP, KPOP"
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

      {showModal === "viewUser" && modalData && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal-content modal-xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>👤 Kullanıcı Profili</h3>
              <button className="modal-close" onClick={() => setShowModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="profile-view">
                <div className="profile-header">
                  <div className="profile-avatar-large">{modalData.name?.charAt(0) || "?"}</div>
                  <div className="profile-main-info">
                    <h2>{modalData.name || "İsimsiz"}</h2>
                    <p className="profile-email">{modalData.email}</p>
                    <span className={`role-badge-large role-${modalData.role?.toLowerCase()}`}>
                      {modalData.role === "DANCER" ? "🕺 Dansçı" :
                       modalData.role === "INSTRUCTOR" ? "👨‍🏫 Eğitmen" :
                       modalData.role === "STUDIO" ? "🏢 Stüdyo" :
                       modalData.role === "REFEREE" ? "⚖️ Hakem" :
                       modalData.role === "ADMIN" ? "⚡ Admin" : modalData.role}
                    </span>
                  </div>
                </div>

                <div className="profile-stats">
                  <div className="profile-stat">
                    <div className="stat-icon">⭐</div>
                    <div className="stat-content">
                      <div className="stat-value">{modalData.rating || 1000}</div>
                      <div className="stat-label">Rating</div>
                    </div>
                  </div>
                  <div className="profile-stat">
                    <div className="stat-icon">⚔️</div>
                    <div className="stat-content">
                      <div className="stat-value">{(modalData._count?.initiatedBattles || 0) + (modalData._count?.challengedBattles || 0)}</div>
                      <div className="stat-label">Toplam Battle</div>
                    </div>
                  </div>
                  <div className="profile-stat">
                    <div className="stat-icon">🏆</div>
                    <div className="stat-content">
                      <div className="stat-value">{modalData._count?.wonBattles || 0}</div>
                      <div className="stat-label">Kazanılan</div>
                    </div>
                  </div>
                  <div className="profile-stat">
                    <div className="stat-icon">📅</div>
                    <div className="stat-content">
                      <div className="stat-value">{new Date(modalData.createdAt).toLocaleDateString("tr-TR")}</div>
                      <div className="stat-label">Kayıt Tarihi</div>
                    </div>
                  </div>
                </div>

                {modalData.badges && modalData.badges.length > 0 && (
                  <div className="profile-section">
                    <h4>🎖️ Rozetler</h4>
                    <div className="profile-badges">
                      {modalData.badges.map((badge, idx) => (
                        <span key={idx} className="profile-badge">{badge}</span>
                      ))}
                    </div>
                  </div>
                )}

                {modalData.bio && (
                  <div className="profile-section">
                    <h4>📝 Bio</h4>
                    <p className="profile-bio">{modalData.bio}</p>
                  </div>
                )}

                {modalData.danceStyles && modalData.danceStyles.length > 0 && (
                  <div className="profile-section">
                    <h4>💃 Dans Stilleri</h4>
                    <div className="profile-tags">
                      {modalData.danceStyles.map((style, idx) => (
                        <span key={idx} className="profile-tag">{style}</span>
                      ))}
                    </div>
                  </div>
                )}

                {modalData.experience !== null && modalData.experience !== undefined && (
                  <div className="profile-section">
                    <h4>🎯 Deneyim</h4>
                    <p className="profile-experience">{modalData.experience} yıl</p>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(null)}>Kapat</button>
              <button 
                className="btn-primary" 
                onClick={() => {
                  setShowModal(null);
                  setTimeout(() => openModal("profile", modalData), 100);
                }}
              >
                Profili Düzenle
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

      {showModal === "createBadge" && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>➕ Yeni Rozet Oluştur</h3>
              <button className="modal-close" onClick={() => setShowModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>🎖️ Rozet Adı</label>
                <input
                  type="text"
                  className="modal-input"
                  id="new-badge-name"
                  placeholder="Örn: 🏆 Champion, 🔥 Fire Dancer, 👑 King"
                />
                <small style={{color: "rgba(255,255,255,0.5)", marginTop: "0.5rem", display: "block"}}>
                  Emoji ile birlikte yazın (emoji + boşluk + isim)
                </small>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(null)}>İptal</button>
              <button
                className="btn-primary"
                disabled={actionLoading}
                onClick={handleCreateBadge}
              >
                {actionLoading ? "Oluşturuluyor..." : "Rozet Oluştur"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal === "deleteBadge" && modalData && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🗑️ Rozet Sil</h3>
              <button className="modal-close" onClick={() => setShowModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="warning-box">
                <div className="warning-icon">⚠️</div>
                <p><strong>{modalData.name}</strong> rozeti silinecek.</p>
                <p>Bu rozete sahip <strong>{modalData.usageCount} kullanıcıdan</strong> kaldırılacak.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowModal(null)}>İptal</button>
              <button
                className="btn-danger"
                disabled={actionLoading}
                onClick={() => handleDeleteBadge(modalData.name)}
              >
                {actionLoading ? "Siliniyor..." : "Rozeti Sil"}
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
