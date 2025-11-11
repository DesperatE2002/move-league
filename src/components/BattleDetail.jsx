"use client";

import React, { useState, useEffect } from 'react';
import { battlesApi, authApi } from '@/lib/api-client';

const BattleDetail = ({ battleId, onBack }) => {
  const [battle, setBattle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showScores, setShowScores] = useState(false);
  const currentUser = authApi.getCurrentUser();

  useEffect(() => {
    loadBattleDetail();
  }, [battleId]);

  const loadBattleDetail = async () => {
    try {
      setLoading(true);
      const response = await battlesApi.getBattles({ battleId });
      // API'den gelen liste içinden battle'ı bul
      const battlesData = response.data || response || [];
      const foundBattle = battlesData.find(b => b.id === battleId);
      setBattle(foundBattle);
    } catch (err) {
      setError('Battle bilgileri yüklenemedi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      await battlesApi.updateBattle(battleId, { action: 'ACCEPT' });
      setSuccess('Battle talebi kabul edildi! 🎉');
      
      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (err) {
      setError('Battle kabul edilemedi: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!confirm('Battle talebini reddetmek istediğinize emin misiniz?')) {
      return;
    }

    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      await battlesApi.updateBattle(battleId, { action: 'REJECT' });
      setSuccess('Battle talebi reddedildi.');
      
      setTimeout(() => {
        onBack();
      }, 2000);
    } catch (err) {
      setError('Battle reddedilemedi: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: { text: 'Bekliyor', color: '#FFA500', icon: '⏳' },
      CHALLENGER_ACCEPTED: { text: 'Kabul Edildi', color: '#34C759', icon: '✅' },
      STUDIO_PENDING: { text: 'Stüdyo Bekliyor', color: '#5856D6', icon: '🏢' },
      STUDIO_REJECTED: { text: 'Stüdyo Reddetti', color: '#ff2d55', icon: '❌' },
      CONFIRMED: { text: 'Onaylandı', color: '#34C759', icon: '✅' },
      BATTLE_SCHEDULED: { text: 'Planlandı', color: '#5856D6', icon: '📅' },
      LIVE: { text: '🔴 CANLI', color: '#ff2d55', icon: '🔴' },
      REJECTED: { text: 'Reddedildi', color: '#ff2d55', icon: '❌' },
      COMPLETED: { text: 'Tamamlandı', color: '#8E8E93', icon: '🏁' },
      CANCELLED: { text: 'İptal Edildi', color: '#8E8E93', icon: '🚫' },
    };
    return badges[status] || badges.PENDING;
  };

  if (loading) {
    return (
      <div className="battle-detail-container">
        <div className="loading-state">Battle yükleniyor...</div>
      </div>
    );
  }

  if (!battle) {
    return (
      <div className="battle-detail-container">
        <div className="error-state">Battle bulunamadı</div>
        <button onClick={onBack} className="back-btn">← Geri Dön</button>
      </div>
    );
  }

  const statusBadge = getStatusBadge(battle.status);
  // Current user battle'ı başlatan kişi mi kontrol et
  const isInitiator = currentUser && currentUser.id === battle.initiatorId;
  // Current user meydan okunan kişi mi kontrol et
  const isChallenged = currentUser && currentUser.id === battle.challengedId;
  // Sadece meydan okunan kişi ve status PENDING ise kabul/red edebilir
  const canAcceptReject = battle.status === 'PENDING' && isChallenged;

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #000000 0%, #1a0505 100%)',
      fontFamily: "'Poppins', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    }}>
      <div className="battle-detail-container">
      <div className="page-header">
        <button className="back-btn" onClick={onBack}>← Geri</button>
        <h1 className="page-title">⚔️ Battle Detayları</h1>
      </div>

      {error && (
        <div className="alert alert-error">
          ⚠️ {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          ✅ {success}
        </div>
      )}

      <div className="battle-card">
        {/* Status Badge */}
        <div className="status-badge" style={{ background: statusBadge.color }}>
          {statusBadge.icon} {statusBadge.text}
        </div>

        {/* Battle Info */}
        <div className="battle-header">
          <h2 className="battle-title">{battle.title}</h2>
          <p className="battle-category">🎵 {battle.category}</p>
        </div>

        {/* Fighters */}
        <div className="fighters-section">
          <div className="fighter-card initiator">
            <div className="fighter-avatar">
              {battle.initiator.avatar ? (
                <img src={battle.initiator.avatar} alt={battle.initiator.name} />
              ) : (
                <div className="avatar-placeholder">
                  {battle.initiator.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="fighter-info">
              <h3 className="fighter-name">{battle.initiator.name}</h3>
              <p className="fighter-role">Meydan Okuyan</p>
              {battle.initiator.danceStyles && (
                <div className="fighter-styles">
                  {battle.initiator.danceStyles.map((style, idx) => (
                    <span key={idx} className="style-tag">{style}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="vs-divider">
            <span className="vs-text">VS</span>
          </div>

          <div className="fighter-card challenged">
            <div className="fighter-avatar">
              {battle.challenged.avatar ? (
                <img src={battle.challenged.avatar} alt={battle.challenged.name} />
              ) : (
                <div className="avatar-placeholder">
                  {battle.challenged.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="fighter-info">
              <h3 className="fighter-name">{battle.challenged.name}</h3>
              <p className="fighter-role">Meydan Okunan</p>
              {battle.challenged.danceStyles && (
                <div className="fighter-styles">
                  {battle.challenged.danceStyles.map((style, idx) => (
                    <span key={idx} className="style-tag">{style}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {battle.description && (
          <div className="description-section">
            <h3>Açıklama</h3>
            <p>{battle.description}</p>
          </div>
        )}

        {/* Actions */}
        {canAcceptReject && (
          <div className="actions-section">
            <h3>Bu battle talebini kabul ediyor musun?</h3>
            <div className="action-buttons">
              <button
                className="btn-accept"
                onClick={handleAccept}
                disabled={actionLoading}
              >
                {actionLoading ? 'İşleniyor...' : '✅ Kabul Et'}
              </button>
              <button
                className="btn-reject"
                onClick={handleReject}
                disabled={actionLoading}
              >
                {actionLoading ? 'İşleniyor...' : '❌ Reddet'}
              </button>
            </div>
          </div>
        )}

        {battle.status === 'PENDING' && isInitiator && (
          <div className="info-section">
            <h4>⏳ Battle Durumu</h4>
            <p>Rakibinizin yanıtı bekleniyor. {battle.challenged.name} henüz battle talebini kabul etmedi.</p>
          </div>
        )}

        {battle.status === 'CHALLENGER_ACCEPTED' && (isInitiator || isChallenged) && (
          <div className="studio-selection-section">
            <h3>✅ Battle Kabul Edildi!</h3>
            <p>Şimdi her iki taraf da en az 1 stüdyo seçmeli ve öncelik sıralaması yapmalı. Ortak olan ve en yüksek önceliğe sahip stüdyo seçilecek.</p>
            <button
              className="btn-select-studios"
              onClick={() => {
                // HomePage'e stüdyo seçimi sinyali gönder
                if (onBack) onBack();
                // StudioSelection component'ine yönlendir
                window.location.hash = `studio-select-${battleId}`;
              }}
            >
              🏢 Stüdyo Seçimi Yap
            </button>
          </div>
        )}

        {battle.status === 'STUDIO_PENDING' && (
          <div className="info-section pending">
            <h4>🏢 Stüdyo Onayı Bekleniyor</h4>
            <p>Her iki taraf da stüdyo seçimini tamamladı. Seçilen stüdyo: <strong>{battle.selectedStudio?.name || 'Bilinmiyor'}</strong></p>
            <p>Stüdyonun onayı bekleniyor. Stüdyo tarih, saat ve konum belirleyecek.</p>
          </div>
        )}

        {battle.status === 'CONFIRMED' && (
          <div className="info-section confirmed">
            <h4>✅ Battle Onaylandı!</h4>
            <p><strong>📅 Tarih:</strong> {battle.scheduledDate ? new Date(battle.scheduledDate).toLocaleDateString('tr-TR', { dateStyle: 'full' }) : '-'}</p>
            <p><strong>🕐 Saat:</strong> {battle.scheduledTime || '-'}</p>
            <p><strong>📍 Konum:</strong> {battle.location || '-'}</p>
            <p><strong>🏢 Stüdyo:</strong> {battle.selectedStudio?.name || '-'}</p>
          </div>
        )}

        {battle.status === 'REJECTED' && (
          <div className="info-section rejected">
            <h4>❌ Battle Reddedildi</h4>
            <p>{battle.challenged.name} battle talebinizi reddetti.</p>
          </div>
        )}

        {battle.status === 'STUDIO_REJECTED' && (
          <div className="info-section rejected">
            <h4>❌ Stüdyo Reddetti</h4>
            <p>Stüdyo battle talebinizi reddetti. Lütfen farklı stüdyolar seçin.</p>
          </div>
        )}

        {battle.status === 'COMPLETED' && (
          <div className="info-section completed">
            <h4>🏁 Battle Tamamlandı</h4>
            {battle.winner && (
              <div className="winner-announcement">
                <p className="winner-text">🏆 Kazanan: <strong>{battle.winner.name}</strong></p>
              </div>
            )}
            {battle.scores && (
              <button 
                className="btn-view-scores"
                onClick={() => setShowScores(true)}
              >
                📊 Puanları Görüntüle
              </button>
            )}
          </div>
        )}

        {/* Scores Modal */}
        {showScores && battle.scores && (
          <div className="modal-overlay" onClick={() => setShowScores(false)}>
            <div className="modal-content scores-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>📊 Battle Puanları</h2>
                <button className="modal-close" onClick={() => setShowScores(false)}>✕</button>
              </div>
              
              <div className="scores-container">
                {/* Initiator Scores */}
                <div className="participant-scores">
                  <div className="participant-header" style={{ borderColor: '#e11d48' }}>
                    <div className="participant-avatar">
                      {battle.initiator.name.charAt(0).toUpperCase()}
                    </div>
                    <h3>{battle.initiator.name}</h3>
                    <span className="participant-label">Meydan Okuyan</span>
                  </div>
                  
                  {battle.scores.initiator && (
                    <div className="score-breakdown">
                      <div className="score-item">
                        <span className="score-label">⚡ Teknik</span>
                        <span className="score-value">{battle.scores.initiator.technique || 0}/10</span>
                      </div>
                      <div className="score-item">
                        <span className="score-label">🎨 Yaratıcılık</span>
                        <span className="score-value">{battle.scores.initiator.creativity || 0}/10</span>
                      </div>
                      <div className="score-item">
                        <span className="score-label">🔥 Performans</span>
                        <span className="score-value">{battle.scores.initiator.performance || 0}/10</span>
                      </div>
                      <div className="score-item">
                        <span className="score-label">🎵 Müzikalite</span>
                        <span className="score-value">{battle.scores.initiator.musicality || 0}/10</span>
                      </div>
                      <div className="score-item">
                        <span className="score-label">💫 Koreografi</span>
                        <span className="score-value">{battle.scores.initiator.choreography || 0}/10</span>
                      </div>
                      <div className="score-total">
                        <span className="score-label">TOPLAM</span>
                        <span className="score-value">
                          {(battle.scores.initiator.technique || 0) + 
                           (battle.scores.initiator.creativity || 0) + 
                           (battle.scores.initiator.performance || 0) + 
                           (battle.scores.initiator.musicality || 0) + 
                           (battle.scores.initiator.choreography || 0)}/50
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* VS Divider */}
                <div className="scores-vs">VS</div>

                {/* Challenged Scores */}
                <div className="participant-scores">
                  <div className="participant-header" style={{ borderColor: '#3b82f6' }}>
                    <div className="participant-avatar">
                      {battle.challenged.name.charAt(0).toUpperCase()}
                    </div>
                    <h3>{battle.challenged.name}</h3>
                    <span className="participant-label">Meydan Okunan</span>
                  </div>
                  
                  {battle.scores.challenged && (
                    <div className="score-breakdown">
                      <div className="score-item">
                        <span className="score-label">⚡ Teknik</span>
                        <span className="score-value">{battle.scores.challenged.technique || 0}/10</span>
                      </div>
                      <div className="score-item">
                        <span className="score-label">🎨 Yaratıcılık</span>
                        <span className="score-value">{battle.scores.challenged.creativity || 0}/10</span>
                      </div>
                      <div className="score-item">
                        <span className="score-label">🔥 Performans</span>
                        <span className="score-value">{battle.scores.challenged.performance || 0}/10</span>
                      </div>
                      <div className="score-item">
                        <span className="score-label">🎵 Müzikalite</span>
                        <span className="score-value">{battle.scores.challenged.musicality || 0}/10</span>
                      </div>
                      <div className="score-item">
                        <span className="score-label">💫 Koreografi</span>
                        <span className="score-value">{battle.scores.challenged.choreography || 0}/10</span>
                      </div>
                      <div className="score-total">
                        <span className="score-label">TOPLAM</span>
                        <span className="score-value">
                          {(battle.scores.challenged.technique || 0) + 
                           (battle.scores.challenged.creativity || 0) + 
                           (battle.scores.challenged.performance || 0) + 
                           (battle.scores.challenged.musicality || 0) + 
                           (battle.scores.challenged.choreography || 0)}/50
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {battle.referee && (
                <div className="referee-info">
                  <p>⚖️ Hakem: <strong>{battle.referee.name}</strong></p>
                </div>
              )}
            </div>
          </div>
        )}

        {battle.status === 'CANCELLED' && (
          <div className="info-section cancelled">
            <h4>🚫 Battle İptal Edildi</h4>
            <p>Bu battle iptal edilmiştir.</p>
          </div>
        )}

        {/* Date Info */}
        <div className="date-info">
          <p className="created-date">
            📅 Oluşturulma: {new Date(battle.createdAt).toLocaleString('tr-TR')}
          </p>
        </div>
      </div>

      <style jsx>{`
        .battle-detail-container {
          padding: 2rem;
          min-height: 100vh;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          color: white;
        }

        .page-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .back-btn {
          padding: 0.75rem 1.5rem;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.3s;
        }

        .back-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateX(-5px);
        }

        .page-title {
          font-size: 2.5rem;
          font-weight: 700;
          margin: 0;
        }

        .loading-state, .error-state {
          text-align: center;
          padding: 3rem;
          font-size: 1.2rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .alert {
          padding: 1rem 1.5rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          animation: slideIn 0.3s ease-out;
        }

        .alert-error {
          background: #fecaca;
          color: var(--accent-red-darker);
          border: 1px solid var(--accent-red-bright);
        }

        .alert-success {
          background: #d1fae5;
          color: #065f46;
          border: 1px solid #34d399;
        }

        .battle-card {
          max-width: 900px;
          margin: 0 auto;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 2rem;
          backdrop-filter: blur(10px);
          position: relative;
        }

        .status-badge {
          position: absolute;
          top: 2rem;
          right: 2rem;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.9rem;
          color: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .battle-header {
          margin-bottom: 2rem;
        }

        .battle-title {
          font-size: 2rem;
          font-weight: 700;
          margin: 0 0 0.5rem 0;
          color: var(--accent-red);
        }

        .battle-category {
          font-size: 1.2rem;
          margin: 0;
          color: rgba(255, 255, 255, 0.8);
        }

        .fighters-section {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 2rem;
          margin: 2rem 0;
          align-items: center;
        }

        .fighter-card {
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1.5rem;
          text-align: center;
        }

        .fighter-card.initiator {
          border-color: var(--accent-red);
        }

        .fighter-card.challenged {
          border-color: #3b82f6;
        }

        .fighter-avatar {
          margin: 0 auto 1rem;
        }

        .fighter-avatar img, .avatar-placeholder {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          object-fit: cover;
          margin: 0 auto;
        }

        .avatar-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--accent-red), var(--accent-red-bright));
          font-size: 2.5rem;
          font-weight: 700;
          color: white;
        }

        .fighter-info {
          text-align: center;
        }

        .fighter-name {
          font-size: 1.3rem;
          font-weight: 600;
          margin: 0 0 0.5rem 0;
        }

        .fighter-role {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.6);
          margin: 0 0 1rem 0;
        }

        .fighter-styles {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          justify-content: center;
        }

        .style-tag {
          padding: 0.25rem 0.75rem;
          background: rgba(225, 29, 72, 0.25);
          border: 1px solid var(--accent-red);
          border-radius: 12px;
          font-size: 0.8rem;
          color: #fca5a5;
        }

        .vs-divider {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .vs-text {
          font-size: 2.5rem;
          font-weight: 900;
          color: var(--accent-red);
          text-shadow: 0 0 20px rgba(225, 29, 72, 0.6);
        }

        .description-section {
          margin: 2rem 0;
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 8px;
        }

        .description-section h3 {
          margin: 0 0 1rem 0;
          color: var(--accent-red);
        }

        .description-section p {
          margin: 0;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.8);
        }

        .actions-section {
          margin: 2rem 0;
          padding: 2rem;
          background: rgba(225, 29, 72, 0.12);
          border: 2px solid var(--accent-red);
          border-radius: 12px;
          text-align: center;
        }

        .actions-section h3 {
          margin: 0 0 1.5rem 0;
          font-size: 1.3rem;
        }

        .action-buttons {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        .btn-accept, .btn-reject {
          padding: 1rem 2rem;
          border: none;
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
          flex: 1;
          max-width: 200px;
        }

        .btn-accept {
          background: linear-gradient(135deg, #34C759, #28a745);
          color: white;
        }

        .btn-accept:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 10px 30px rgba(52, 199, 89, 0.4);
        }

        .btn-reject {
          background: linear-gradient(135deg, var(--accent-red-bright), var(--accent-red));
          color: white;
        }

        .btn-reject:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 10px 30px rgba(225, 29, 72, 0.5);
        }

        .btn-accept:disabled, .btn-reject:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .info-section {
          margin: 2rem 0;
          padding: 1.5rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          text-align: center;
        }

        .info-section h4 {
          margin: 0 0 1rem 0;
          font-size: 1.3rem;
          color: white;
        }

        .info-section p {
          margin: 0.5rem 0;
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.8);
        }

        .info-section.pending {
          background: rgba(255, 193, 7, 0.15);
          border: 2px solid rgba(255, 193, 7, 0.4);
        }

        .info-section.pending h4 {
          color: #ffd54f;
        }

        .info-section.confirmed {
          background: rgba(52, 199, 89, 0.15);
          border: 2px solid rgba(52, 199, 89, 0.4);
        }

        .info-section.confirmed h4 {
          color: #69f0ae;
        }

        .info-section.confirmed p strong {
          color: white;
        }

        .info-section.rejected, .info-section.cancelled {
          background: rgba(220, 38, 38, 0.15);
          border: 2px solid rgba(220, 38, 38, 0.4);
        }

        .info-section.rejected h4, .info-section.cancelled h4 {
          color: #ff6b6b;
        }

        .info-section.completed {
          background: rgba(156, 39, 176, 0.15);
          border: 2px solid rgba(156, 39, 176, 0.4);
        }

        .info-section.completed h4 {
          color: #ce93d8;
        }

        .winner-announcement {
          margin: 1.5rem 0;
          padding: 1rem;
          background: rgba(255, 215, 0, 0.1);
          border: 2px solid rgba(255, 215, 0, 0.3);
          border-radius: 8px;
        }

        .winner-text {
          font-size: 1.3rem;
          color: #ffd700;
          margin: 0;
        }

        .winner-text strong {
          color: white;
          text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
        }

        .btn-view-scores {
          margin-top: 1rem;
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #8b5cf6, #6366f1);
          border: none;
          border-radius: 8px;
          color: white;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-view-scores:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(139, 92, 246, 0.4);
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
          animation: fadeIn 0.3s ease-out;
        }

        .modal-content {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 16px;
          max-width: 900px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          animation: slideUp 0.3s ease-out;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 2rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .modal-header h2 {
          margin: 0;
          font-size: 1.8rem;
          color: white;
        }

        .modal-close {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          color: white;
          font-size: 1.5rem;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-close:hover {
          background: rgba(220, 38, 38, 0.3);
          transform: rotate(90deg);
        }

        .scores-container {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 2rem;
          padding: 2rem;
          align-items: start;
        }

        .participant-scores {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          padding: 1.5rem;
        }

        .participant-header {
          text-align: center;
          padding-bottom: 1rem;
          border-bottom: 2px solid;
          margin-bottom: 1.5rem;
        }

        .participant-avatar {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent-red), var(--accent-red-bright));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          font-weight: 700;
          color: white;
          margin: 0 auto 1rem;
        }

        .participant-header h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.3rem;
          color: white;
        }

        .participant-label {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.6);
        }

        .score-breakdown {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .score-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          transition: all 0.3s;
        }

        .score-item:hover {
          background: rgba(255, 255, 255, 0.08);
          transform: translateX(5px);
        }

        .score-label {
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.8);
        }

        .score-value {
          font-size: 1.1rem;
          font-weight: 700;
          color: white;
        }

        .score-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: linear-gradient(135deg, rgba(220, 38, 38, 0.2), rgba(139, 92, 246, 0.2));
          border: 2px solid rgba(220, 38, 38, 0.3);
          border-radius: 8px;
          margin-top: 0.5rem;
        }

        .score-total .score-label {
          font-size: 1.1rem;
          font-weight: 700;
          color: #ffd700;
        }

        .score-total .score-value {
          font-size: 1.5rem;
          font-weight: 900;
          color: #ffd700;
          text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
        }

        .scores-vs {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          font-weight: 900;
          color: var(--accent-red);
          text-shadow: 0 0 20px rgba(225, 29, 72, 0.6);
        }

        .referee-info {
          padding: 1rem 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          text-align: center;
        }

        .referee-info p {
          margin: 0;
          color: rgba(255, 255, 255, 0.7);
          font-size: 1rem;
        }

        .referee-info strong {
          color: white;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .studio-selection-section {
          margin: 2rem 0;
          padding: 2rem;
          background: rgba(91, 134, 229, 0.2);
          border: 2px solid rgba(91, 134, 229, 0.4);
          border-radius: 12px;
          text-align: center;
        }

        .studio-selection-section h3 {
          margin: 0 0 1rem 0;
          font-size: 1.5rem;
          color: white;
        }

        .studio-selection-section p {
          margin: 0 0 1.5rem 0;
          color: rgba(255, 255, 255, 0.8);
          font-size: 1rem;
        }

        .btn-select-studios {
          padding: 1rem 2rem;
          background: linear-gradient(135deg, #5b86e5, #3b5998);
          border: none;
          border-radius: 10px;
          color: white;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-select-studios:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(91, 134, 229, 0.4);
        }

        .date-info {
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .created-date {
          margin: 0;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.6);
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 768px) {
          .fighters-section {
            grid-template-columns: 1fr;
          }

          .vs-divider {
            transform: rotate(90deg);
          }

          .action-buttons {
            flex-direction: column;
          }

          .btn-accept, .btn-reject {
            max-width: 100%;
          }

          .scores-container {
            grid-template-columns: 1fr;
          }

          .scores-vs {
            transform: rotate(90deg);
            padding: 1rem 0;
          }

          .modal-content {
            margin: 1rem;
          }

          .modal-header {
            padding: 1rem;
          }

          .modal-header h2 {
            font-size: 1.3rem;
          }

          .scores-container {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
    </div>
  );
};

export default BattleDetail;
