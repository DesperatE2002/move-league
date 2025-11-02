"use client";

import React, { useState, useEffect } from 'react';
import { authApi } from '@/lib/api-client';

const WorkshopsPage = ({ onBack, onWorkshopClick, onCreateClick }) => {
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, beginner, intermediate, advanced
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState('all'); // 'all' veya 'my' (eğitmen için)
  const currentUser = authApi.getCurrentUser();
  const isInstructor = currentUser?.role === 'INSTRUCTOR';

  console.log('WorkshopsPage RENDERED!', { loading, workshopsCount: workshops.length });

  useEffect(() => {
    console.log('WorkshopsPage useEffect triggered');
    loadWorkshops();
  }, []);

  const loadWorkshops = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/workshops?isActive=true', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setWorkshops(data.data || data); // Handle both formats
      }
    } catch (error) {
      console.error('Load workshops error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredWorkshops = workshops.filter(workshop => {
    // Eğitmen için "Workshoplarım" filtresi
    if (isInstructor && viewMode === 'my') {
      if (workshop.instructorId !== currentUser.userId) return false;
    }
    
    if (filter !== 'all' && workshop.level !== filter) return false;
    if (categoryFilter !== 'all' && workshop.category !== categoryFilter) return false;
    return true;
  });

  const categories = [...new Set(workshops.map(w => w.category))];

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #000000 0%, #1a0505 100%)',
      fontFamily: "'Poppins', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    }}>
      <div className="workshops-page">
      {/* Header */}
      <div className="page-header">
        {onBack && (
          <button 
            onClick={onBack}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'all 0.3s ease',
              marginBottom: '10px'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
              e.target.style.transform = 'translateX(-3px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
              e.target.style.transform = 'translateX(0)';
            }}
          >
            ← Geri
          </button>
        )}
        <div>
          <h2>🎓 Workshop</h2>
          <p>Dans workshoplarını keşfet ve katıl</p>
        </div>
        {isInstructor && (
          <button className="btn-create" onClick={onCreateClick}>
            ➕ Yeni Workshop Oluştur
          </button>
        )}
      </div>

      {/* View Mode Tabs (Eğitmen için) */}
      {isInstructor && (
        <div className="view-mode-tabs">
          <button
            className={viewMode === 'all' ? 'active' : ''}
            onClick={() => setViewMode('all')}
          >
            📚 Tüm Workshoplar
          </button>
          <button
            className={viewMode === 'my' ? 'active' : ''}
            onClick={() => setViewMode('my')}
          >
            🎯 Workshoplarım
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="filters">
        <div className="filter-group">
          <label>Seviye:</label>
          <div className="filter-buttons">
            <button
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              Tümü
            </button>
            <button
              className={filter === 'beginner' ? 'active' : ''}
              onClick={() => setFilter('beginner')}
            >
              Başlangıç
            </button>
            <button
              className={filter === 'intermediate' ? 'active' : ''}
              onClick={() => setFilter('intermediate')}
            >
              Orta
            </button>
            <button
              className={filter === 'advanced' ? 'active' : ''}
              onClick={() => setFilter('advanced')}
            >
              İleri
            </button>
          </div>
        </div>

        <div className="filter-group">
          <label>Kategori:</label>
          <div className="filter-buttons">
            <button
              className={categoryFilter === 'all' ? 'active' : ''}
              onClick={() => setCategoryFilter('all')}
            >
              Tümü
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                className={categoryFilter === cat ? 'active' : ''}
                onClick={() => setCategoryFilter(cat)}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Workshop Grid */}
      {loading ? (
        <div className="loading">Yükleniyor...</div>
      ) : filteredWorkshops.length === 0 ? (
        <div className="empty-state">
          <p>Henüz workshop bulunmuyor.</p>
          {isInstructor && (
            <button className="btn-create-alt" onClick={onCreateClick}>
              İlk Workshop'u Oluştur
            </button>
          )}
        </div>
      ) : (
        <div className="workshops-grid">
          {filteredWorkshops.map(workshop => (
            <div
              key={workshop.id}
              className="workshop-card"
              onClick={() => onWorkshopClick(workshop.id)}
            >
              {/* Thumbnail */}
              <div className="workshop-thumbnail">
                {workshop.thumbnailUrl ? (
                  <img src={workshop.thumbnailUrl} alt={workshop.title} />
                ) : (
                  <div className="placeholder-thumbnail">
                    <span>🎬</span>
                  </div>
                )}
                <div className="workshop-badge">
                  {workshop.level === 'beginner' && '🟢 Başlangıç'}
                  {workshop.level === 'intermediate' && '🟡 Orta'}
                  {workshop.level === 'advanced' && '🔴 İleri'}
                </div>
              </div>

              {/* Content */}
              <div className="workshop-content">
                <h3>{workshop.title}</h3>
                <div className="workshop-category">
                  {workshop.category.charAt(0).toUpperCase() + workshop.category.slice(1)}
                </div>

                <div className="workshop-info">
                  <div className="info-item">
                    <span>👤</span>
                    <span>{workshop.instructor.name}</span>
                  </div>
                  <div className="info-item">
                    <span>📅</span>
                    <span>
                      {new Date(workshop.scheduledDate).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                      })}
                    </span>
                  </div>
                  <div className="info-item">
                    <span>🕐</span>
                    <span>{workshop.scheduledTime}</span>
                  </div>
                  <div className="info-item">
                    <span>⏱</span>
                    <span>{workshop.duration} dk</span>
                  </div>
                  <div className="info-item">
                    <span>📍</span>
                    <span>{workshop.location}</span>
                  </div>
                  <div className="info-item">
                    <span>👥</span>
                    <span>{workshop.currentParticipants}/{workshop.capacity}</span>
                  </div>
                </div>

                <div className="workshop-price">
                  <span className="price-label">Fiyat:</span>
                  <span className="price-amount">₺{workshop.price}</span>
                </div>

                {/* Eğitmen için kendi workshop'larında istatistik göster */}
                {isInstructor && workshop.instructorId === currentUser.userId && (
                  <div className="instructor-stats-mini">
                    <div className="stat-mini">
                      <span className="stat-icon">💰</span>
                      <span className="stat-value">₺{(workshop.currentParticipants * workshop.price).toLocaleString('tr-TR')}</span>
                    </div>
                    <div className="stat-mini">
                      <span className="stat-icon">👥</span>
                      <span className="stat-value">{workshop.currentParticipants} Kayıt</span>
                    </div>
                    <button 
                      className="btn-view-stats"
                      onClick={(e) => {
                        e.stopPropagation();
                        onWorkshopClick(workshop.id);
                      }}
                    >
                      📊 Detayları Gör
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .workshops-page {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .page-header h2 {
          margin: 0;
          font-size: 2rem;
          color: white;
        }

        .page-header p {
          margin: 0.5rem 0 0 0;
          color: rgba(255, 255, 255, 0.7);
        }

        .view-mode-tabs {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          padding: 0.5rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .view-mode-tabs button {
          flex: 1;
          padding: 1rem 2rem;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.6);
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .view-mode-tabs button:hover {
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.9);
        }

        .view-mode-tabs button.active {
          background: linear-gradient(135deg, #5856D6, #7C3AED);
          border-color: #5856D6;
          color: white;
          box-shadow: 0 5px 20px rgba(88, 86, 214, 0.3);
        }

        .btn-create {
          padding: 1rem 2rem;
          background: linear-gradient(135deg, #5856D6, #7C3AED);
          border: none;
          border-radius: 8px;
          color: white;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-create:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(88, 86, 214, 0.4);
        }

        .filters {
          display: flex;
          gap: 2rem;
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          flex-wrap: wrap;
        }

        .filter-group {
          flex: 1;
          min-width: 300px;
        }

        .filter-group label {
          display: block;
          margin-bottom: 0.5rem;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 600;
        }

        .filter-buttons {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .filter-buttons button {
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          transition: all 0.3s;
        }

        .filter-buttons button.active {
          background: #5856D6;
          border-color: #5856D6;
          color: white;
        }

        .filter-buttons button:hover:not(.active) {
          background: rgba(255, 255, 255, 0.15);
        }

        .loading, .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          color: rgba(255, 255, 255, 0.6);
        }

        .btn-create-alt {
          margin-top: 1rem;
          padding: 1rem 2rem;
          background: #5856D6;
          border: none;
          border-radius: 8px;
          color: white;
          cursor: pointer;
        }

        .workshops-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 2rem;
        }

        .workshop-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s;
        }

        .workshop-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          border-color: #5856D6;
        }

        .workshop-thumbnail {
          position: relative;
          width: 100%;
          height: 200px;
          background: linear-gradient(135deg, #1a1a1a, #2a2a2a);
          overflow: hidden;
        }

        .workshop-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .placeholder-thumbnail {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 4rem;
        }

        .workshop-badge {
          position: absolute;
          top: 1rem;
          right: 1rem;
          padding: 0.5rem 1rem;
          background: rgba(0, 0, 0, 0.8);
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .workshop-content {
          padding: 1.5rem;
        }

        .workshop-content h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.3rem;
          color: white;
        }

        .workshop-category {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          background: rgba(88, 86, 214, 0.2);
          border: 1px solid #5856D6;
          border-radius: 12px;
          font-size: 0.85rem;
          color: #a5a3ff;
          margin-bottom: 1rem;
        }

        .workshop-info {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .workshop-price {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .price-label {
          color: rgba(255, 255, 255, 0.6);
        }

        .price-amount {
          font-size: 1.5rem;
          font-weight: 700;
          color: #34C759;
        }

        .instructor-stats-mini {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .stat-mini {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(88, 86, 214, 0.15);
          border: 1px solid rgba(88, 86, 214, 0.3);
          border-radius: 8px;
        }

        .stat-mini .stat-icon {
          font-size: 1.2rem;
        }

        .stat-mini .stat-value {
          font-weight: 600;
          color: white;
          font-size: 0.95rem;
        }

        .btn-view-stats {
          margin-left: auto;
          padding: 0.5rem 1rem;
          background: linear-gradient(135deg, #5856D6, #7C3AED);
          border: none;
          border-radius: 6px;
          color: white;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          white-space: nowrap;
        }

        .btn-view-stats:hover {
          transform: scale(1.05);
          box-shadow: 0 5px 15px rgba(88, 86, 214, 0.4);
        }

        @media (max-width: 768px) {
          .workshops-grid {
            grid-template-columns: 1fr;
          }

          .filters {
            flex-direction: column;
            gap: 1rem;
          }

          .page-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
        }
      `}</style>
    </div>
    </div>
  );
};

export default WorkshopsPage;
