import React, { useState, useEffect } from 'react';
import { authApi } from '@/lib/api-client';
import './DancerInvitations.css';

const DancerInvitations = ({ onBackClick }) => {
  const [invitations, setInvitations] = useState([]);
  const [filter, setFilter] = useState('PENDING');
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(null);

  useEffect(() => {
    loadInvitations();
  }, [filter]);

  const loadInvitations = async () => {
    try {
      setLoading(true);
      const response = await authApi.getCompetitionInvitations(filter);
      setInvitations(response.invitations || []);
    } catch (err) {
      console.error('Davetler yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (invitationId, action) => {
    const actionText = action === 'accept' ? 'kabul' : 'reddetme';
    const confirmed = window.confirm(
      `Bu daveti ${actionText} etmek istediğinizden emin misiniz?`
    );

    if (!confirmed) return;

    try {
      setResponding(invitationId);
      await authApi.respondToInvitation(invitationId, action);
      
      const message = action === 'accept' 
        ? '✅ Davet kabul edildi! Takıma eklendiniz.' 
        : '❌ Davet reddedildi.';
      alert(message);
      
      loadInvitations();
    } catch (err) {
      console.error('Davet cevaplama hatası:', err);
      alert('❌ İşlem başarısız: ' + err.message);
    } finally {
      setResponding(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Az önce';
    if (diffMins < 60) return `${diffMins} dakika önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays < 7) return `${diffDays} gün önce`;
    
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatEventDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: { text: '⏳ Bekliyor', class: 'pending' },
      ACCEPTED: { text: '✅ Kabul Edildi', class: 'accepted' },
      REJECTED: { text: '❌ Reddedildi', class: 'rejected' }
    };
    return badges[status] || badges.PENDING;
  };

  return (
    <div className="dancer-invitations">
      <div className="invitations-header">
        <button onClick={onBackClick} className="back-button">← Geri</button>
        <h2>📨 Takım Davetlerim</h2>
      </div>

      {/* Filtreler */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${filter === 'PENDING' ? 'active' : ''}`}
          onClick={() => setFilter('PENDING')}
        >
          ⏳ Bekleyen ({invitations.filter(i => i.status === 'PENDING').length || 0})
        </button>
        <button
          className={`filter-tab ${filter === 'ACCEPTED' ? 'active' : ''}`}
          onClick={() => setFilter('ACCEPTED')}
        >
          ✅ Kabul Edilen
        </button>
        <button
          className={`filter-tab ${filter === 'REJECTED' ? 'active' : ''}`}
          onClick={() => setFilter('REJECTED')}
        >
          ❌ Reddedilen
        </button>
        <button
          className={`filter-tab ${filter === '' ? 'active' : ''}`}
          onClick={() => setFilter('')}
        >
          📋 Tümü
        </button>
      </div>

      {/* İçerik */}
      <div className="invitations-content">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Davetler yükleniyor...</p>
          </div>
        ) : invitations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>Davet bulunamadı</h3>
            <p>
              {filter === 'PENDING' ? 
                'Bekleyen davetiniz bulunmuyor' : 
                filter ? 
                  `${getStatusBadge(filter).text} davetiniz yok` :
                  'Henüz hiç davet almadınız'}
            </p>
          </div>
        ) : (
          <div className="invitations-list">
            {invitations.map(invitation => {
              const status = getStatusBadge(invitation.status);
              const isPending = invitation.status === 'PENDING';
              
              return (
                <div key={invitation.id} className={`invitation-card ${invitation.status.toLowerCase()}`}>
                  <div className="invitation-header">
                    <div className="header-left">
                      <h3>{invitation.team?.name || 'İsimsiz Takım'}</h3>
                      <span className={`status-badge ${status.class}`}>
                        {status.text}
                      </span>
                    </div>
                    <div className="invitation-time">
                      {formatDate(invitation.createdAt)}
                    </div>
                  </div>

                  <div className="invitation-body">
                    <div className="competition-info">
                      <h4>🏆 {invitation.team?.competition?.name || 'Yarışma'}</h4>
                      <div className="info-grid">
                        <div className="info-item">
                          <span className="info-label">📅 Etkinlik Tarihi:</span>
                          <span className="info-value">
                            {invitation.team?.competition?.eventDate ? 
                              formatEventDate(invitation.team.competition.eventDate) : 
                              'Belirtilmemiş'}
                          </span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">📍 Mekan:</span>
                          <span className="info-value">
                            {invitation.team?.competition?.venue || 'Belirtilmemiş'}
                          </span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">👑 Takım Lideri:</span>
                          <span className="info-value">
                            {invitation.team?.leader?.name || invitation.sender?.name || 'Bilinmiyor'}
                          </span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">👥 Mevcut Üye:</span>
                          <span className="info-value">
                            {invitation.team?._count?.members || 0} kişi
                          </span>
                        </div>
                      </div>
                    </div>

                    {invitation.message && (
                      <div className="invitation-message">
                        <strong>💬 Mesaj:</strong>
                        <p>{invitation.message}</p>
                      </div>
                    )}

                    {invitation.respondedAt && (
                      <div className="responded-info">
                        <small>
                          {invitation.status === 'ACCEPTED' ? '✅' : '❌'} 
                          {' '}Cevaplandı: {formatDate(invitation.respondedAt)}
                        </small>
                      </div>
                    )}
                  </div>

                  {isPending && (
                    <div className="invitation-actions">
                      <button
                        onClick={() => handleResponse(invitation.id, 'reject')}
                        className="reject-button"
                        disabled={responding === invitation.id}
                      >
                        {responding === invitation.id ? '⏳' : '❌ Reddet'}
                      </button>
                      <button
                        onClick={() => handleResponse(invitation.id, 'accept')}
                        className="accept-button"
                        disabled={responding === invitation.id}
                      >
                        {responding === invitation.id ? '⏳ İşleniyor...' : '✅ Kabul Et'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DancerInvitations;
