"use client";

import React, { useState, useEffect } from 'react';
import { authApi } from '@/lib/api-client';

const WorkshopDetail = ({ workshopId, onBack }) => {
  const [workshop, setWorkshop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const currentUser = authApi.getCurrentUser();

  useEffect(() => {
    if (workshopId) {
      loadWorkshop();
    }
  }, [workshopId]);

  const loadWorkshop = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/workshops/${workshopId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setWorkshop(data.data || data); // Handle both formats
      }
    } catch (error) {
      console.error('Load workshop error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!confirm(`Bu workshop'a ${workshop.price} TL karşılığında katılmak istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      setEnrolling(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/workshops/${workshopId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'ENROLL',
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('✅ Workshop kaydınız başarıyla oluşturuldu!');
        loadWorkshop(); // Yenile
      } else {
        alert(`❌ Hata: ${data.error}`);
      }
    } catch (error) {
      console.error('Enroll error:', error);
      alert('Bir hata oluştu.');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return <div className="loading">Yükleniyor...</div>;
  }

  if (!workshop) {
    return <div className="error">Workshop bulunamadı.</div>;
  }

  const isEnrolled = workshop.enrollments.some(e => e.userId === currentUser?.userId);
  const isInstructor = workshop.instructorId === currentUser?.userId;
  const isFull = workshop.currentParticipants >= workshop.capacity;

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #000000 0%, #1a0505 100%)',
      fontFamily: "'Poppins', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    }}>
      <div className="workshop-detail">
      {/* Back Button */}
      <button className="btn-back" onClick={onBack}>
        ← Geri
      </button>

      {/* Video Player */}
      {workshop.videoUrl && (
        <div className="video-container">
          <video controls poster={workshop.thumbnailUrl}>
            <source src={workshop.videoUrl} type="video/mp4" />
            Tarayıcınız video oynatmayı desteklemiyor.
          </video>
        </div>
      )}

      {/* Header */}
      <div className="workshop-header">
        <div>
          <h1>{workshop.title}</h1>
          <div className="header-meta">
            <span className="category-badge">
              {workshop.category.charAt(0).toUpperCase() + workshop.category.slice(1)}
            </span>
            <span className="level-badge level-{workshop.level}">
              {workshop.level === 'beginner' && '🟢 Başlangıç'}
              {workshop.level === 'intermediate' && '🟡 Orta'}
              {workshop.level === 'advanced' && '🔴 İleri'}
            </span>
          </div>
        </div>
        <div className="price-section">
          <div className="price-label">Workshop Ücreti</div>
          <div className="price-amount">₺{workshop.price}</div>
        </div>
      </div>

      {/* Instructor Info */}
      <div className="instructor-section">
        <div className="instructor-avatar">
          {workshop.instructor.avatar ? (
            <img src={workshop.instructor.avatar} alt={workshop.instructor.name} />
          ) : (
            <div className="avatar-placeholder">
              {workshop.instructor.name.charAt(0)}
            </div>
          )}
        </div>
        <div className="instructor-info">
          <div className="instructor-label">Eğitmen</div>
          <div className="instructor-name">{workshop.instructor.name}</div>
          {workshop.instructor.experience && (
            <div className="instructor-exp">{workshop.instructor.experience} yıl deneyim</div>
          )}
          {workshop.instructor.bio && (
            <div className="instructor-bio">{workshop.instructor.bio}</div>
          )}
        </div>
      </div>

      {/* Workshop Info Grid */}
      <div className="info-grid">
        <div className="info-card">
          <div className="info-icon">📅</div>
          <div className="info-label">Tarih</div>
          <div className="info-value">
            {new Date(workshop.scheduledDate).toLocaleDateString('tr-TR', {
              dateStyle: 'full',
            })}
          </div>
        </div>

        <div className="info-card">
          <div className="info-icon">🕐</div>
          <div className="info-label">Saat</div>
          <div className="info-value">{workshop.scheduledTime}</div>
        </div>

        <div className="info-card">
          <div className="info-icon">⏱</div>
          <div className="info-label">Süre</div>
          <div className="info-value">{workshop.duration} dakika</div>
        </div>

        <div className="info-card">
          <div className="info-icon">👥</div>
          <div className="info-label">Kapasite</div>
          <div className="info-value">
            {workshop.currentParticipants}/{workshop.capacity} kişi
          </div>
        </div>

        <div className="info-card full-width">
          <div className="info-icon">📍</div>
          <div className="info-label">Konum</div>
          <div className="info-value">{workshop.location}</div>
          {workshop.address && (
            <div className="info-sub">{workshop.address}</div>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="description-section">
        <h3>Workshop Açıklaması</h3>
        <p>{workshop.description}</p>
      </div>

      {/* Requirements */}
      {workshop.requirements && (
        <div className="requirements-section">
          <h3>Ön Gereksinimler</h3>
          <p>{workshop.requirements}</p>
        </div>
      )}

      {/* Participants */}
      {workshop.enrollments.length > 0 && (
        <div className="participants-section">
          <h3>Katılımcılar ({workshop.enrollments.length})</h3>
          <div className="participants-list">
            {workshop.enrollments.map(enrollment => (
              <div key={enrollment.id} className="participant-item">
                {enrollment.user.avatar ? (
                  <img src={enrollment.user.avatar} alt={enrollment.user.name} />
                ) : (
                  <div className="participant-avatar">
                    {enrollment.user.name.charAt(0)}
                  </div>
                )}
                <span>{enrollment.user.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Enroll Button */}
      {!isInstructor && (
        <div className="action-section">
          {isEnrolled ? (
            <div className="enrolled-badge">
              ✅ Bu workshop'a kayıtlısınız
            </div>
          ) : isFull ? (
            <div className="full-badge">
              ⚠️ Workshop kapasitesi doldu
            </div>
          ) : (
            <button
              className="btn-enroll"
              onClick={handleEnroll}
              disabled={enrolling}
            >
              {enrolling ? 'İşleniyor...' : `₺${workshop.price} - Workshop'a Katıl`}
            </button>
          )}
        </div>
      )}

      {isInstructor && (
        <div className="instructor-actions">
          <p>Bu workshop'u siz oluşturdunuz.</p>
        </div>
      )}

      <style jsx>{`
        .workshop-detail {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
          animation: fadeIn 0.3s;
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

        .btn-back {
          padding: 0.75rem 1.5rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: white;
          cursor: pointer;
          margin-bottom: 2rem;
          transition: all 0.3s;
        }

        .btn-back:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .video-container {
          width: 100%;
          max-height: 500px;
          margin-bottom: 2rem;
          border-radius: 12px;
          overflow: hidden;
          background: #000;
        }

        .video-container video {
          width: 100%;
          height: 100%;
          max-height: 500px;
        }

        .workshop-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          gap: 2rem;
        }

        .workshop-header h1 {
          margin: 0 0 1rem 0;
          font-size: 2.5rem;
          color: white;
        }

        .header-meta {
          display: flex;
          gap: 1rem;
        }

        .category-badge, .level-badge {
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .category-badge {
          background: rgba(88, 86, 214, 0.2);
          border: 1px solid #5856D6;
          color: #a5a3ff;
        }

        .level-badge {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
        }

        .price-section {
          text-align: right;
          padding: 1.5rem;
          background: linear-gradient(135deg, rgba(52, 199, 89, 0.2), rgba(48, 209, 88, 0.2));
          border: 2px solid #34C759;
          border-radius: 12px;
        }

        .price-label {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 0.5rem;
        }

        .price-amount {
          font-size: 2.5rem;
          font-weight: 700;
          color: #34C759;
        }

        .instructor-section {
          display: flex;
          gap: 1.5rem;
          padding: 2rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          margin-bottom: 2rem;
        }

        .instructor-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
        }

        .instructor-avatar img, .avatar-placeholder {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #5856D6, #7C3AED);
          color: white;
          font-size: 2rem;
          font-weight: 700;
        }

        .instructor-label {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 0.5rem;
        }

        .instructor-name {
          font-size: 1.5rem;
          font-weight: 600;
          color: white;
          margin-bottom: 0.5rem;
        }

        .instructor-exp {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 0.5rem;
        }

        .instructor-bio {
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.6;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .info-card {
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          text-align: center;
        }

        .info-card.full-width {
          grid-column: 1 / -1;
        }

        .info-icon {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }

        .info-label {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 0.5rem;
        }

        .info-value {
          font-size: 1.2rem;
          font-weight: 600;
          color: white;
        }

        .info-sub {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.7);
          margin-top: 0.5rem;
        }

        .description-section, .requirements-section {
          padding: 2rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          margin-bottom: 2rem;
        }

        .description-section h3, .requirements-section h3 {
          margin: 0 0 1rem 0;
          color: white;
        }

        .description-section p, .requirements-section p {
          margin: 0;
          line-height: 1.8;
          color: rgba(255, 255, 255, 0.8);
        }

        .participants-section {
          padding: 2rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          margin-bottom: 2rem;
        }

        .participants-section h3 {
          margin: 0 0 1.5rem 0;
          color: white;
        }

        .participants-list {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .participant-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 20px;
        }

        .participant-item img, .participant-avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
        }

        .participant-avatar {
          display: flex;
          align-items: center;
          justify-content: center;
          background: #5856D6;
          color: white;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .action-section {
          text-align: center;
          padding: 2rem;
        }

        .btn-enroll {
          padding: 1.5rem 3rem;
          background: linear-gradient(135deg, #34C759, #28a745);
          border: none;
          border-radius: 12px;
          color: white;
          font-size: 1.3rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-enroll:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 10px 40px rgba(52, 199, 89, 0.4);
        }

        .btn-enroll:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .enrolled-badge, .full-badge {
          display: inline-block;
          padding: 1.5rem 3rem;
          border-radius: 12px;
          font-size: 1.2rem;
          font-weight: 600;
        }

        .enrolled-badge {
          background: rgba(52, 199, 89, 0.2);
          border: 2px solid #34C759;
          color: #69f0ae;
        }

        .full-badge {
          background: rgba(255, 149, 0, 0.2);
          border: 2px solid #FF9500;
          color: #ffb74d;
        }

        .instructor-actions {
          text-align: center;
          padding: 2rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .loading, .error {
          text-align: center;
          padding: 4rem 2rem;
          color: rgba(255, 255, 255, 0.6);
        }

        @media (max-width: 768px) {
          .workshop-header {
            flex-direction: column;
          }

          .info-grid {
            grid-template-columns: 1fr;
          }

          .info-card.full-width {
            grid-column: 1;
          }
        }
      `}</style>
    </div>
    </div>
  );
};

export default WorkshopDetail;
