import React, { useState, useEffect } from 'react';
import { authApi } from '@/lib/api-client';
import './CompetitionsView.css';

const CompetitionsView = ({ onBackClick, onCompetitionClick, onCreateClick, userRole }) => {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, upcoming, active, past

  useEffect(() => {
    loadCompetitions();
  }, []);

  const loadCompetitions = async () => {
    try {
      setLoading(true);
      const data = await authApi.getCompetitions();
      setCompetitions(data.competitions || []);
    } catch (error) {
      console.error('Yarışmalar yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (competition) => {
    const now = new Date();
    const eventDate = new Date(competition.eventDate);
    const registrationStart = new Date(competition.registrationStart);
    const registrationEnd = new Date(competition.registrationEnd);

    if (competition.status === 'COMPLETED') {
      return { text: 'Tamamlandı', class: 'completed' };
    }
    if (now >= registrationStart && now <= registrationEnd) {
      return { text: 'Kayıt Açık', class: 'active' };
    }
    if (now > registrationEnd && now < eventDate) {
      return { text: 'Hazırlık Dönemi', class: 'preparing' };
    }
    if (now > eventDate) {
      return { text: 'Geçmiş', class: 'past' };
    }
    return { text: 'Yaklaşan', class: 'upcoming' };
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredCompetitions = competitions.filter(comp => {
    const now = new Date();
    const eventDate = new Date(comp.eventDate);
    const registrationEnd = new Date(comp.registrationEnd);

    if (filter === 'upcoming') {
      return eventDate > now && comp.status !== 'COMPLETED';
    }
    if (filter === 'active') {
      return now <= registrationEnd && comp.status !== 'COMPLETED';
    }
    if (filter === 'past') {
      return eventDate < now || comp.status === 'COMPLETED';
    }
    return true;
  });

  return (
    <div className="competitions-view">
      <div className="competitions-header">
        <button onClick={onBackClick} className="back-button">
          ← Geri
        </button>
        <h2>🏆 Move Show Yarışmaları</h2>
        {userRole === 'admin' && onCreateClick && (
          <button onClick={onCreateClick} className="create-competition-btn">
            ➕ Yeni Yarışma
          </button>
        )}
      </div>

      <div className="competitions-filters">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Tümü ({competitions.length})
        </button>
        <button 
          className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
          onClick={() => setFilter('active')}
        >
          Kayıt Açık
        </button>
        <button 
          className={`filter-btn ${filter === 'upcoming' ? 'active' : ''}`}
          onClick={() => setFilter('upcoming')}
        >
          Yaklaşan
        </button>
        <button 
          className={`filter-btn ${filter === 'past' ? 'active' : ''}`}
          onClick={() => setFilter('past')}
        >
          Geçmiş
        </button>
      </div>

      {loading ? (
        <div className="loading-message">Yükleniyor...</div>
      ) : filteredCompetitions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎭</div>
          <p>Henüz yarışma bulunmuyor</p>
        </div>
      ) : (
        <div className="competitions-grid">
          {filteredCompetitions.map(competition => {
            const badge = getStatusBadge(competition);
            const teamCount = competition.teams?.length || 0;

            return (
              <div 
                key={competition.id} 
                className="competition-card"
                onClick={() => onCompetitionClick(competition.id)}
              >
                <div className="competition-card-header">
                  <h3>{competition.name}</h3>
                  <span className={`status-badge ${badge.class}`}>
                    {badge.text}
                  </span>
                </div>

                <div className="competition-card-body">
                  <div className="competition-info-row">
                    <span className="info-icon">📅</span>
                    <span>{formatDate(competition.eventDate)}</span>
                  </div>

                  <div className="competition-info-row">
                    <span className="info-icon">📍</span>
                    <span>{competition.venue || competition.location}</span>
                  </div>

                  <div className="competition-info-row">
                    <span className="info-icon">👥</span>
                    <span>{teamCount} / {competition.maxTeams} Takım</span>
                  </div>

                  {competition.songRevealed && (
                    <div className="competition-info-row song-revealed">
                      <span className="info-icon">🎵</span>
                      <span>{competition.songTitle}</span>
                    </div>
                  )}

                  {competition.prizeFirst && (
                    <div className="competition-prize">
                      <span className="prize-icon">🥇</span>
                      <span>{competition.prizeFirst.toLocaleString('tr-TR')} ₺</span>
                    </div>
                  )}
                </div>

                <div className="competition-card-footer">
                  <span className="view-details">Detayları Gör →</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CompetitionsView;
