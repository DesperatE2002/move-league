"use client";

import React, { useState } from 'react';

const LeaguesView = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('active');

  const mockLeagues = {
    active: [
      {
        id: 1,
        name: "Adana Hip Hop League Spring 2025",
        category: "Hip Hop",
        participants: 32,
        maxParticipants: 32,
        startDate: "2025-03-15",
        location: "Merkez Park Dans Stüdyosu",
        prizePool: "15,000₺",
        status: "ongoing",
        progress: 65
      },
      {
        id: 2,
        name: "Breaking Championship",
        category: "Breaking",
        participants: 24,
        maxParticipants: 32,
        startDate: "2025-04-01",
        location: "Adana Spor Salonu",
        prizePool: "20,000₺",
        status: "registration",
        progress: 75
      },
      {
        id: 3,
        name: "Latin Dance Battle Series",
        category: "Salsa/Bachata",
        participants: 16,
        maxParticipants: 16,
        startDate: "2025-03-20",
        location: "Latin Dance Academy",
        prizePool: "10,000₺",
        status: "ongoing",
        progress: 50
      }
    ],
    past: [
      {
        id: 4,
        name: "Winter Freestyle Battle 2024",
        category: "Freestyle",
        participants: 28,
        winner: "DJ Ramazan",
        endDate: "2024-12-28",
        prizePool: "12,000₺",
        status: "completed"
      },
      {
        id: 5,
        name: "Popping Masters Cup",
        category: "Popping",
        participants: 20,
        winner: "Zeynep Kaya",
        endDate: "2024-11-15",
        prizePool: "8,000₺",
        status: "completed"
      }
    ]
  };

  const getStatusBadge = (status) => {
    const badges = {
      ongoing: { text: "Devam Ediyor", color: "#34C759" },
      registration: { text: "Kayıt Açık", color: "#FF9500" },
      completed: { text: "Tamamlandı", color: "#8E8E93" }
    };
    return badges[status] || badges.ongoing;
  };

  return (
    <div className="leagues-root">
      <div className="page-header">
        <button className="back-btn" onClick={onBack}>← Geri</button>
        <h1 className="page-title">🏆 Ligler</h1>
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Aktif Ligler ({mockLeagues.active.length})
        </button>
        <button 
          className={`tab ${activeTab === 'past' ? 'active' : ''}`}
          onClick={() => setActiveTab('past')}
        >
          Geçmiş Ligler ({mockLeagues.past.length})
        </button>
      </div>

      <div className="leagues-grid">
        {activeTab === 'active' ? (
          mockLeagues.active.map(league => (
            <div key={league.id} className="league-card">
              <div className="league-header">
                <h3 className="league-name">{league.name}</h3>
                <span 
                  className="status-badge" 
                  style={{ background: getStatusBadge(league.status).color }}
                >
                  {getStatusBadge(league.status).text}
                </span>
              </div>

              <div className="league-info">
                <div className="info-item">
                  <span className="info-label">Kategori</span>
                  <span className="info-value">{league.category}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Katılımcı</span>
                  <span className="info-value">{league.participants}/{league.maxParticipants}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Tarih</span>
                  <span className="info-value">{new Date(league.startDate).toLocaleDateString('tr-TR')}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Konum</span>
                  <span className="info-value">{league.location}</span>
                </div>
              </div>

              <div className="progress-section">
                <div className="progress-header">
                  <span>İlerleme</span>
                  <span>{league.progress}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${league.progress}%` }} />
                </div>
              </div>

              <div className="league-footer">
                <div className="prize-info">
                  <span className="prize-icon">💰</span>
                  <span className="prize-amount">{league.prizePool}</span>
                </div>
                <button className="details-btn">Detaylar →</button>
              </div>
            </div>
          ))
        ) : (
          mockLeagues.past.map(league => (
            <div key={league.id} className="league-card past">
              <div className="league-header">
                <h3 className="league-name">{league.name}</h3>
                <span 
                  className="status-badge" 
                  style={{ background: getStatusBadge(league.status).color }}
                >
                  {getStatusBadge(league.status).text}
                </span>
              </div>

              <div className="league-info">
                <div className="info-item">
                  <span className="info-label">Kategori</span>
                  <span className="info-value">{league.category}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Katılımcı</span>
                  <span className="info-value">{league.participants} kişi</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Bitiş</span>
                  <span className="info-value">{new Date(league.endDate).toLocaleDateString('tr-TR')}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Kazanan</span>
                  <span className="info-value winner">🏆 {league.winner}</span>
                </div>
              </div>

              <div className="league-footer">
                <div className="prize-info">
                  <span className="prize-icon">💰</span>
                  <span className="prize-amount">{league.prizePool}</span>
                </div>
                <button className="details-btn">Detaylar →</button>
              </div>
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .leagues-root {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .back-btn {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: white;
          padding: 0.6rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.95rem;
        }

        .back-btn:hover {
          background: rgba(255,255,255,0.1);
          transform: translateX(-3px);
        }

        .page-title {
          margin: 0;
          font-size: 1.8rem;
          font-weight: 700;
          color: white;
        }

        .tabs {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .tab {
          background: rgba(30,30,30,0.6);
          border: 1px solid rgba(255,255,255,0.1);
          color: #b0b0b0;
          padding: 0.8rem 1.5rem;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 600;
        }

        .tab:hover {
          background: rgba(40,40,40,0.8);
          color: white;
        }

        .tab.active {
          background: linear-gradient(90deg, #FF3B30, #d42b20);
          color: white;
          border-color: transparent;
        }

        .leagues-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
        }

        .league-card {
          background: rgba(30,30,30,0.8);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          padding: 1.5rem;
          transition: all 0.3s;
        }

        .league-card:hover {
          transform: translateY(-4px);
          border-color: #FF3B30;
          box-shadow: 0 12px 40px rgba(0,0,0,0.4);
        }

        .league-card.past {
          opacity: 0.8;
        }

        .league-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
          gap: 1rem;
        }

        .league-name {
          margin: 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: white;
          line-height: 1.4;
        }

        .status-badge {
          padding: 0.3rem 0.8rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          color: white;
          white-space: nowrap;
        }

        .league-info {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.8rem;
          margin-bottom: 1rem;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }

        .info-label {
          font-size: 0.75rem;
          color: #888;
          text-transform: uppercase;
          font-weight: 600;
        }

        .info-value {
          font-size: 0.95rem;
          color: #e0e0e0;
          font-weight: 500;
        }

        .info-value.winner {
          color: #FFD700;
          font-weight: 600;
        }

        .progress-section {
          margin-bottom: 1rem;
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
          font-size: 0.85rem;
          color: #b0b0b0;
        }

        .progress-bar {
          height: 6px;
          background: rgba(255,255,255,0.1);
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #FF3B30, #FF9500);
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .league-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 1rem;
          border-top: 1px solid rgba(255,255,255,0.05);
        }

        .prize-info {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .prize-icon {
          font-size: 1.2rem;
        }

        .prize-amount {
          font-size: 1rem;
          font-weight: 700;
          color: #FFD700;
        }

        .details-btn {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .details-btn:hover {
          background: rgba(255,59,48,0.2);
          border-color: #FF3B30;
          transform: translateX(3px);
        }

        @media (max-width: 768px) {
          .leagues-root {
            padding: 1rem;
          }

          .page-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .tabs {
            flex-direction: column;
          }

          .tab {
            width: 100%;
          }

          .leagues-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default LeaguesView;
