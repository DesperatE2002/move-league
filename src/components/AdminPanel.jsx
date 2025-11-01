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
        <div className="coming-soon">
          <div className="coming-soon-icon">🚧</div>
          <h3>Admin Panel Yeniden Yapılandırılıyor</h3>
          <p>Tüm özellikler aktif hale getiriliyor...</p>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
