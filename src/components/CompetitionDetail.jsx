import React, { useState, useEffect } from 'react';
import { authApi } from '@/lib/api-client';
import './CompetitionDetail.css';

const CompetitionDetail = ({ competitionId, onBackClick, userRole, currentUserId, onCreateTeam, onViewInvitations }) => {
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revealSongData, setRevealSongData] = useState({
    songTitle: '',
    songArtist: '',
    songUrl: ''
  });
  const [showRevealForm, setShowRevealForm] = useState(false);

  useEffect(() => {
    loadCompetition();
  }, [competitionId]);

  const loadCompetition = async () => {
    try {
      setLoading(true);
      const response = await authApi.getCompetition(competitionId);
      setCompetition(response.competition);
    } catch (err) {
      console.error('Yarışma yükleme hatası:', err);
      setError('Yarışma bilgileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleRevealSong = async (e) => {
    e.preventDefault();
    if (!revealSongData.songTitle || !revealSongData.songUrl) {
      alert('⚠️ Şarkı adı ve URL zorunludur!');
      return;
    }

    try {
      await authApi.revealSong(competitionId, revealSongData);
      alert('✅ Şarkı başarıyla açıklandı! Takım liderlerine bildirim gönderildi.');
      setShowRevealForm(false);
      loadCompetition();
    } catch (err) {
      console.error('Şarkı açıklama hatası:', err);
      alert('❌ Şarkı açıklanamadı: ' + err.message);
    }
  };

  const getStatusBadge = () => {
    if (!competition) return { text: '', class: '' };
    
    const now = new Date();
    const regStart = new Date(competition.registrationStart);
    const regEnd = new Date(competition.registrationEnd);
    const eventDate = new Date(competition.eventDate);

    if (competition.status === 'COMPLETED') {
      return { text: '🏁 Tamamlandı', class: 'completed' };
    }
    if (competition.status === 'ONGOING') {
      return { text: '🎬 Devam Ediyor', class: 'ongoing' };
    }
    if (competition.songRevealed || competition.status === 'SONG_REVEALED') {
      return { text: '🎵 Şarkı Açıklandı', class: 'revealed' };
    }
    if (now >= regStart && now <= regEnd) {
      return { text: '✅ Kayıtlar Açık', class: 'active' };
    }
    if (now > regEnd && now < eventDate) {
      return { text: '⏰ Hazırlık Aşaması', class: 'preparing' };
    }
    if (now < regStart) {
      return { text: '📅 Yaklaşan', class: 'upcoming' };
    }
    return { text: '❓ Bilinmiyor', class: 'unknown' };
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

  const formatDateOnly = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getUserTeam = () => {
    if (!competition || !currentUserId) return null;
    return competition.teams?.find(team => 
      team.leaderId === currentUserId || 
      team.members.some(m => m.userId === currentUserId)
    );
  };

  if (loading) {
    return <div className="competition-detail-loading">Yükleniyor...</div>;
  }

  if (error || !competition) {
    return (
      <div className="competition-detail-error">
        <p>{error || 'Yarışma bulunamadı'}</p>
        <button onClick={onBackClick}>← Geri Dön</button>
      </div>
    );
  }

  const status = getStatusBadge();
  const userTeam = getUserTeam();
  const isAdmin = userRole === 'admin';
  const canRevealSong = isAdmin && !competition.songRevealed;
  const now = new Date();
  const canRegister = now >= new Date(competition.registrationStart) && 
                       now <= new Date(competition.registrationEnd);

  return (
    <div className="competition-detail">
      <div className="detail-header">
        <button onClick={onBackClick} className="back-button">← Geri</button>
        <h2>{competition.name}</h2>
        <span className={`status-badge ${status.class}`}>{status.text}</span>
      </div>

      <div className="detail-content">
        {/* Action Buttons for Instructor/Dancer */}
        {canRegister && userRole === 'instructor' && !userTeam && (
          <div className="action-section">
            <button onClick={() => onCreateTeam && onCreateTeam(competitionId)} className="primary-action-btn">
              🎭 Takım Oluştur
            </button>
          </div>
        )}
        
        {canRegister && userRole === 'dancer' && (
          <div className="action-section">
            <button onClick={() => onViewInvitations && onViewInvitations()} className="secondary-action-btn">
              📨 Davetlerimi Gör
            </button>
          </div>
        )}

        {/* Temel Bilgiler */}
        <div className="info-card">
          <h3>📋 Etkinlik Bilgileri</h3>
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">📅 Tarih:</span>
              <span className="info-value">{formatDate(competition.eventDate)}</span>
            </div>
            <div className="info-item">
              <span className="info-label">📍 Mekan:</span>
              <span className="info-value">{competition.venue || 'Belirtilmemiş'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">🌆 Konum:</span>
              <span className="info-value">{competition.location || 'Belirtilmemiş'}</span>
            </div>
            {competition.address && (
              <div className="info-item full-width">
                <span className="info-label">🗺️ Adres:</span>
                <span className="info-value">{competition.address}</span>
              </div>
            )}
          </div>

          {competition.description && (
            <div className="description">
              <p>{competition.description}</p>
            </div>
          )}

          {competition.rules && (
            <div className="rules">
              <h4>📜 Kurallar</h4>
              <p>{competition.rules}</p>
            </div>
          )}
        </div>

        {/* Zaman Çizelgesi */}
        <div className="timeline-card">
          <h3>⏰ Zaman Çizelgesi</h3>
          <div className="timeline">
            <div className="timeline-item">
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <strong>Kayıt Başlangıç</strong>
                <span>{formatDate(competition.registrationStart)}</span>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <strong>Kayıt Bitiş</strong>
                <span>{formatDate(competition.registrationEnd)}</span>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <strong>Şarkı Açıklanma</strong>
                <span>{formatDate(competition.songRevealDate)}</span>
              </div>
            </div>
            <div className="timeline-item">
              <div className="timeline-dot active"></div>
              <div className="timeline-content">
                <strong>Etkinlik Günü</strong>
                <span>{formatDate(competition.eventDate)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Şarkı Bilgisi */}
        {competition.songRevealed && (
          <div className="song-card revealed">
            <h3>🎵 Yarışma Şarkısı</h3>
            <div className="song-info">
              <p className="song-title">{competition.songTitle}</p>
              {competition.songArtist && (
                <p className="song-artist">Sanatçı: {competition.songArtist}</p>
              )}
              {competition.songUrl && (
                <a href={competition.songUrl} target="_blank" rel="noopener noreferrer" 
                   className="song-link">
                  🎧 Şarkıyı Dinle
                </a>
              )}
            </div>
          </div>
        )}

        {/* Admin Şarkı Açıklama */}
        {canRevealSong && (
          <div className="reveal-song-section">
            {!showRevealForm ? (
              <button onClick={() => setShowRevealForm(true)} className="reveal-button">
                🎵 Şarkıyı Açıkla
              </button>
            ) : (
              <div className="reveal-form-card">
                <h3>🎵 Şarkıyı Açıkla</h3>
                <form onSubmit={handleRevealSong}>
                  <div className="form-group">
                    <label>Şarkı Adı *</label>
                    <input
                      type="text"
                      value={revealSongData.songTitle}
                      onChange={(e) => setRevealSongData(prev => ({ ...prev, songTitle: e.target.value }))}
                      placeholder="örn: Shape of You"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Sanatçı</label>
                    <input
                      type="text"
                      value={revealSongData.songArtist}
                      onChange={(e) => setRevealSongData(prev => ({ ...prev, songArtist: e.target.value }))}
                      placeholder="örn: Ed Sheeran"
                    />
                  </div>
                  <div className="form-group">
                    <label>Spotify/YouTube URL *</label>
                    <input
                      type="url"
                      value={revealSongData.songUrl}
                      onChange={(e) => setRevealSongData(prev => ({ ...prev, songUrl: e.target.value }))}
                      placeholder="https://..."
                      required
                    />
                  </div>
                  <div className="form-actions">
                    <button type="button" onClick={() => setShowRevealForm(false)}>İptal</button>
                    <button type="submit" className="submit">✅ Açıkla</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Takım Ayarları */}
        <div className="team-settings-card">
          <h3>👥 Takım Ayarları</h3>
          <div className="settings-grid">
            <div className="setting-item">
              <span className="setting-label">Min. Üye:</span>
              <span className="setting-value">{competition.minTeamMembers}</span>
            </div>
            <div className="setting-item">
              <span className="setting-label">Max. Üye:</span>
              <span className="setting-value">{competition.maxTeamMembers}</span>
            </div>
            <div className="setting-item">
              <span className="setting-label">Max. Takım:</span>
              <span className="setting-value">{competition.maxTeams || '∞'}</span>
            </div>
          </div>
        </div>

        {/* Ödüller */}
        {(competition.prizeFirst || competition.prizeSecond || competition.prizeThird) && (
          <div className="prizes-card">
            <h3>🏅 Ödüller</h3>
            <div className="prizes-grid">
              {competition.prizeFirst > 0 && (
                <div className="prize-item first">
                  <span className="prize-medal">🥇</span>
                  <span className="prize-amount">{competition.prizeFirst.toLocaleString('tr-TR')} ₺</span>
                </div>
              )}
              {competition.prizeSecond > 0 && (
                <div className="prize-item second">
                  <span className="prize-medal">🥈</span>
                  <span className="prize-amount">{competition.prizeSecond.toLocaleString('tr-TR')} ₺</span>
                </div>
              )}
              {competition.prizeThird > 0 && (
                <div className="prize-item third">
                  <span className="prize-medal">🥉</span>
                  <span className="prize-amount">{competition.prizeThird.toLocaleString('tr-TR')} ₺</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Kullanıcının Takımı */}
        {userTeam && (
          <div className="user-team-card">
            <h3>🎭 Takımınız</h3>
            <div className="team-info">
              <h4>{userTeam.name}</h4>
              <p>Lider: {userTeam.leader?.name || 'Bilinmiyor'}</p>
              <div className="team-members">
                <strong>Üyeler ({userTeam.members?.length || 0}):</strong>
                <ul>
                  {userTeam.members?.map(member => (
                    <li key={member.userId}>
                      {member.user?.name || 'İsimsiz'} 
                      {member.role === 'LEADER' && ' 👑'}
                      {member.role === 'SUBSTITUTE' && ' 🔄'}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Takımlar Listesi */}
        <div className="teams-card">
          <h3>🏆 Kayıtlı Takımlar ({competition.teams?.length || 0})</h3>
          {competition.teams && competition.teams.length > 0 ? (
            <div className="teams-list">
              {competition.teams.map(team => (
                <div key={team.id} className="team-item">
                  <div className="team-header">
                    <h4>{team.name}</h4>
                    {team.isApproved && <span className="approved-badge">✅ Onaylı</span>}
                  </div>
                  <p className="team-leader">Lider: {team.leader?.name || 'Bilinmiyor'}</p>
                  <p className="team-count">
                    👥 {team.members?.length || 0} Üye
                  </p>
                  {team.finalScore && (
                    <p className="team-score">⭐ Puan: {team.finalScore}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="no-teams">Henüz kayıtlı takım bulunmuyor</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompetitionDetail;
