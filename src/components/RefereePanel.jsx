"use client";

import React, { useState, useEffect } from 'react';
import { battlesApi, authApi } from '@/lib/api-client';

/**
 * RefereePanel.jsx
 * Hakem paneli - Battle puanlama ve kazanan belirleme
 */

const RefereePanel = ({ onBack }) => {
  const [battles, setBattles] = useState([]);
  const [selectedBattle, setSelectedBattle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState(false);
  const currentUser = authApi.getCurrentUser();

  // Puanlama kriterleri
  const scoringCriteria = [
    { id: 'technique', label: 'Teknik', icon: '⚡', description: 'Dans tekniği, zorluk seviyesi' },
    { id: 'creativity', label: 'Yaratıcılık', icon: '🎨', description: 'Orijinallik, yenilikçi hareketler' },
    { id: 'performance', label: 'Performans', icon: '🔥', description: 'Sahne hakimiyeti, enerji' },
    { id: 'musicality', label: 'Müzikalite', icon: '🎵', description: 'Ritim, müzikle uyum' },
    { id: 'choreography', label: 'Koreografi', icon: '💫', description: 'Akış, çeşitlilik, kompozisyon' },
  ];

  const [scores, setScores] = useState({
    initiator: {
      technique: 0,
      creativity: 0,
      performance: 0,
      musicality: 0,
      choreography: 0,
    },
    challenged: {
      technique: 0,
      creativity: 0,
      performance: 0,
      musicality: 0,
      choreography: 0,
    }
  });

  // No-show tracking
  const [noShow, setNoShow] = useState({
    initiator: false,
    challenged: false,
  });

  useEffect(() => {
    if (currentUser?.role !== 'REFEREE') {
      alert('Bu sayfaya erişim yetkiniz yok!');
      onBack();
      return;
    }
    loadBattles();
  }, []);

  // selectedBattle değiştiğinde scores'u sıfırla
  useEffect(() => {
    if (selectedBattle) {
      setScores({
        initiator: {
          technique: 0,
          creativity: 0,
          performance: 0,
          musicality: 0,
          choreography: 0,
        },
        challenged: {
          technique: 0,
          creativity: 0,
          performance: 0,
          musicality: 0,
          choreography: 0,
        }
      });
      
      // No-show durumlarını sıfırla
      setNoShow({
        initiator: false,
        challenged: false,
      });
    }
  }, [selectedBattle?.id]); // selectedBattle.id değiştiğinde tetikle

  const loadBattles = async () => {
    try {
      setLoading(true);
      console.log('🔍 Current User:', currentUser);
      console.log('🔍 User ID:', currentUser?.id);
      
      const response = await battlesApi.getBattles();
      const battlesData = response?.data?.battles || response?.battles || response?.data || [];
      console.log('📦 All battles:', battlesData);
      
      // Sadece hakeme atanan battle'ları filtrele
      const myBattles = battlesData.filter(b => {
        console.log(`🔍 Battle ${b.id}: refereeId=${b.refereeId}, currentUserId=${currentUser?.id}, status=${b.status}, match=${b.refereeId === currentUser?.id}`);
        return b.refereeId === currentUser?.id && 
               ['CONFIRMED', 'BATTLE_SCHEDULED', 'LIVE'].includes(b.status);
      });
      
      setBattles(myBattles);
      console.log('✅ Hakem battle\'ları yüklendi:', myBattles.length);
      console.log('📋 Filtrelenmiş battles:', myBattles);
    } catch (err) {
      console.error('❌ Battle yükleme hatası:', err);
      alert('Battle\'lar yüklenemedi: ' + (err.message || 'Bilinmeyen hata'));
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (participant, criterion, value) => {
    setScores(prev => ({
      ...prev,
      [participant]: {
        ...prev[participant],
        [criterion]: Math.max(0, Math.min(10, value))
      }
    }));
  };

  const calculateTotal = (participant) => {
    return Object.values(scores[participant]).reduce((sum, score) => sum + score, 0);
  };

  const handleSubmitScores = async () => {
    if (!selectedBattle) return;

    // No-show kontrolü
    if (noShow.initiator && noShow.challenged) {
      if (!window.confirm('Her iki katılımcı da gelmedi olarak işaretlendi. Battle iptal edilecek ve her ikisi de -50 puan cezası alacak. Onaylıyor musunuz?')) {
        return;
      }

      try {
        setScoring(true);
        await battlesApi.updateBattle(selectedBattle.id, {
          action: 'BOTH_NO_SHOW',
        });
        alert('✅ Battle iptal edildi, her iki katılımcı da -50 puan cezası aldı.');
        setSelectedBattle(null);
        await loadBattles();
        return;
      } catch (err) {
        alert('Hata: ' + err.message);
        setScoring(false);
        return;
      }
    }

    // Tek taraf gelmedi
    if (noShow.initiator || noShow.challenged) {
      const noShowName = noShow.initiator ? selectedBattle.initiator.name : selectedBattle.challenged.name;
      const winnerId = noShow.initiator ? selectedBattle.challengedId : selectedBattle.initiatorId;
      const winnerName = noShow.initiator ? selectedBattle.challenged.name : selectedBattle.initiator.name;

      if (!window.confirm(`${noShowName} gelmedi olarak işaretlendi.\n\n${noShowName}: -50 puan cezası\n${winnerName}: Otomatik kazanan (puan artmaz)\n\nOnaylıyor musunuz?`)) {
        return;
      }

      try {
        setScoring(true);
        await battlesApi.updateBattle(selectedBattle.id, {
          action: 'SINGLE_NO_SHOW',
          initiatorNoShow: noShow.initiator,
          challengedNoShow: noShow.challenged,
          winnerId: winnerId,
        });
        alert(`✅ ${noShowName} gelmedi. ${winnerName} kazanan ilan edildi.`);
        setSelectedBattle(null);
        setNoShow({ initiator: false, challenged: false });
        await loadBattles();
        return;
      } catch (err) {
        alert('Hata: ' + err.message);
        setScoring(false);
        return;
      }
    }

    // Normal puanlama
    const initiatorTotal = calculateTotal('initiator');
    const challengedTotal = calculateTotal('challenged');

    if (initiatorTotal === 0 && challengedTotal === 0) {
      alert('Lütfen en az bir puan verin!');
      return;
    }

    if (!window.confirm(`Puanları onaylıyor musunuz?\n\n${selectedBattle.initiator.name}: ${initiatorTotal}/50\n${selectedBattle.challenged.name}: ${challengedTotal}/50\n\nKazanan: ${initiatorTotal > challengedTotal ? selectedBattle.initiator.name : challengedTotal > initiatorTotal ? selectedBattle.challenged.name : 'Berabere'}`)) {
      return;
    }

    try {
      setScoring(true);

      await battlesApi.updateBattle(selectedBattle.id, {
        action: 'SUBMIT_SCORES',
        scores: {
          initiator: { ...scores.initiator, total: initiatorTotal },
          challenged: { ...scores.challenged, total: challengedTotal }
        },
        winnerId: initiatorTotal > challengedTotal ? selectedBattle.initiatorId : 
                  challengedTotal > initiatorTotal ? selectedBattle.challengedId : null
      });

      alert('✅ Puanlama başarıyla kaydedildi!');
      setSelectedBattle(null);
      setScores({
        initiator: { technique: 0, creativity: 0, performance: 0, musicality: 0, choreography: 0 },
        challenged: { technique: 0, creativity: 0, performance: 0, musicality: 0, choreography: 0 }
      });
      setNoShow({ initiator: false, challenged: false });
      await loadBattles();
    } catch (err) {
      console.error('❌ Puanlama kaydetme hatası:', err);
      alert('Puanlama kaydedilemedi: ' + err.message);
    } finally {
      setScoring(false);
    }
  };

  if (loading) {
    return (
      <div className="referee-panel">
        <div className="loading">
          <div className="spinner"></div>
          <p>Battle\'lar yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Battle detayı gösteriliyor
  if (selectedBattle) {
    const initiatorTotal = calculateTotal('initiator');
    const challengedTotal = calculateTotal('challenged');

    return (
      <div className="referee-panel">
        <div className="panel-header">
          <button className="back-btn" onClick={() => setSelectedBattle(null)}>← Geri</button>
          <h1 className="panel-title">⚖️ Battle Puanlama</h1>
        </div>

        <div className="battle-info-card">
          <h2>{selectedBattle.title || 'Battle'}</h2>
          <div className="versus">
            <div className="fighter">
              <div className="fighter-name">{selectedBattle.initiator.name}</div>
              <div className="fighter-score">{initiatorTotal}/50</div>
            </div>
            <div className="vs-icon">⚔️ VS ⚔️</div>
            <div className="fighter">
              <div className="fighter-name">{selectedBattle.challenged.name}</div>
              <div className="fighter-score">{challengedTotal}/50</div>
            </div>
          </div>
          {selectedBattle.scheduledDate && (
            <div className="battle-date">
              📅 {new Date(selectedBattle.scheduledDate).toLocaleDateString('tr-TR')}
            </div>
          )}
          
          {/* No-Show Checkboxes */}
          <div className="no-show-section" style={{
            marginTop: '20px',
            padding: '15px',
            background: 'rgba(255, 59, 48, 0.1)',
            border: '1px solid rgba(255, 59, 48, 0.3)',
            borderRadius: '8px'
          }}>
            <h4 style={{ marginBottom: '10px', fontSize: '14px', color: '#ff3b30' }}>
              ⚠️ Katılmayan Var mı?
            </h4>
            <div style={{ display: 'flex', gap: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={noShow.initiator}
                  onChange={(e) => setNoShow(prev => ({ ...prev, initiator: e.target.checked }))}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span>{selectedBattle.initiator.name} Gelmedi (-50 puan)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={noShow.challenged}
                  onChange={(e) => setNoShow(prev => ({ ...prev, challenged: e.target.checked }))}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span>{selectedBattle.challenged.name} Gelmedi (-50 puan)</span>
              </label>
            </div>
          </div>
        </div>

        <div className="scoring-section">
          <h3>📊 Puanlama Kriterleri</h3>
          
          {scoringCriteria.map(criterion => (
            <div key={criterion.id} className="criterion-row">
              <div className="criterion-header">
                <div className="criterion-title">
                  <span className="criterion-icon">{criterion.icon}</span>
                  <div>
                    <strong>{criterion.label}</strong>
                    <small>{criterion.description}</small>
                  </div>
                </div>
              </div>

              <div className="score-inputs">
                <div className="score-group">
                  <label>{selectedBattle.initiator.name}</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={scores.initiator[criterion.id]}
                    onChange={(e) => handleScoreChange('initiator', criterion.id, parseInt(e.target.value) || 0)}
                    className="score-input"
                  />
                  <span className="max-score">/10</span>
                </div>

                <div className="score-group">
                  <label>{selectedBattle.challenged.name}</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={scores.challenged[criterion.id]}
                    onChange={(e) => handleScoreChange('challenged', criterion.id, parseInt(e.target.value) || 0)}
                    className="score-input"
                  />
                  <span className="max-score">/10</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="submit-section">
          {/* Battle'ı LIVE yap butonu */}
          {selectedBattle.status !== 'LIVE' && (
            <button
              className="btn-go-live"
              onClick={async () => {
                if (window.confirm('Battle\'ı canlı duruma getirmek istiyor musunuz?')) {
                  try {
                    await battlesApi.updateBattle(selectedBattle.id, { action: 'START_LIVE' });
                    alert('✅ Battle canlı duruma getirildi!');
                    setSelectedBattle(prev => ({ ...prev, status: 'LIVE' }));
                  } catch (err) {
                    alert('Hata: ' + err.message);
                  }
                }
              }}
              style={{
                background: 'linear-gradient(90deg, #FF3B30, #d42b20)',
                marginBottom: '15px'
              }}
            >
              🔴 Battle\'ı LIVE Yap
            </button>
          )}
          
          {selectedBattle.status === 'LIVE' && (
            <div style={{
              background: 'rgba(255, 59, 48, 0.2)',
              border: '2px solid #FF3B30',
              borderRadius: '12px',
              padding: '15px',
              marginBottom: '15px',
              textAlign: 'center',
              animation: 'pulse 2s infinite'
            }}>
              <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#FF3B30' }}>
                🔴 CANLI
              </span>
            </div>
          )}
          
          <button
            className="btn-submit"
            onClick={handleSubmitScores}
            disabled={scoring}
          >
            {scoring ? 'Kaydediliyor...' : '✅ Puanları Kaydet ve Kazananı Belirle'}
          </button>
        </div>

        <style jsx>{`
          .referee-panel {
            min-height: 100vh;
            background: linear-gradient(135deg, #1a1a1a 0%, #2d1a1a 100%);
            color: #fff;
            padding: 2rem;
          }

          .panel-header {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 2rem;
          }

          .back-btn {
            background: rgba(255,255,255,0.1);
            border: 1px solid rgba(255,255,255,0.2);
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 12px;
            cursor: pointer;
            font-size: 1rem;
            transition: all 0.3s;
          }

          .back-btn:hover {
            background: rgba(255,255,255,0.15);
          }

          .panel-title {
            font-size: 2rem;
            margin: 0;
          }

          .battle-info-card {
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 16px;
            padding: 2rem;
            margin-bottom: 2rem;
          }

          .battle-info-card h2 {
            text-align: center;
            margin: 0 0 1.5rem 0;
          }

          .versus {
            display: flex;
            align-items: center;
            justify-content: space-around;
            gap: 2rem;
          }

          .fighter {
            text-align: center;
            flex: 1;
          }

          .fighter-name {
            font-size: 1.3rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: #FF3B30;
          }

          .fighter-score {
            font-size: 2.5rem;
            font-weight: bold;
            color: #10b981;
          }

          .vs-icon {
            font-size: 2rem;
            color: #b0b0b0;
          }

          .battle-date {
            text-align: center;
            margin-top: 1rem;
            color: #b0b0b0;
          }

          .scoring-section {
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 16px;
            padding: 2rem;
            margin-bottom: 2rem;
          }

          .scoring-section h3 {
            margin: 0 0 1.5rem 0;
          }

          .criterion-row {
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 1rem;
          }

          .criterion-header {
            margin-bottom: 1rem;
          }

          .criterion-title {
            display: flex;
            align-items: flex-start;
            gap: 1rem;
          }

          .criterion-icon {
            font-size: 2rem;
          }

          .criterion-title strong {
            display: block;
            font-size: 1.1rem;
            margin-bottom: 0.25rem;
          }

          .criterion-title small {
            display: block;
            color: #b0b0b0;
            font-size: 0.9rem;
          }

          .score-inputs {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1.5rem;
          }

          .score-group {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .score-group label {
            font-weight: 600;
            font-size: 0.95rem;
          }

          .score-input {
            width: 100%;
            padding: 0.75rem;
            font-size: 1.2rem;
            text-align: center;
            background: rgba(255,255,255,0.1);
            border: 2px solid rgba(255,255,255,0.2);
            border-radius: 8px;
            color: white;
            font-weight: bold;
          }

          .score-input:focus {
            outline: none;
            border-color: #FF3B30;
            box-shadow: 0 0 0 3px rgba(255,59,48,0.2);
          }

          .max-score {
            text-align: center;
            color: #b0b0b0;
            font-size: 0.9rem;
          }

          .submit-section {
            text-align: center;
          }

          .btn-submit {
            background: linear-gradient(90deg, #10b981, #059669);
            border: none;
            color: white;
            padding: 1.25rem 3rem;
            border-radius: 12px;
            cursor: pointer;
            font-size: 1.1rem;
            font-weight: 600;
            transition: all 0.3s;
            box-shadow: 0 10px 30px rgba(16,185,129,0.3);
          }

          .btn-submit:hover:not(:disabled) {
            box-shadow: 0 12px 40px rgba(16,185,129,0.4);
            transform: translateY(-2px);
          }

          .btn-submit:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 400px;
          }

          .spinner {
            border: 4px solid rgba(255,255,255,0.1);
            border-top-color: #FF3B30;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            to { transform: rotate(360deg); }
          }

          @media (max-width: 768px) {
            .versus {
              flex-direction: column;
            }

            .score-inputs {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </div>
    );
  }

  // Battle listesi
  return (
    <div className="referee-panel">
      <div className="panel-header">
        <button className="back-btn" onClick={onBack}>← Geri</button>
        <h1 className="panel-title">⚖️ Hakem Paneli</h1>
      </div>

      <div className="stats-card">
        <div className="stat">
          <div className="stat-icon">⚔️</div>
          <div className="stat-value">{battles.length}</div>
          <div className="stat-label">Atandığım Battle</div>
        </div>
      </div>

      <div className="battles-section">
        <h2>📋 Puanlama Bekleyen Battle'lar</h2>
        
        {battles.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p>Henüz size atanan battle bulunmuyor</p>
            <small>Admin tarafından bir battle'a atandığınızda buradan görebilirsiniz</small>
          </div>
        ) : (
          <div className="battles-grid">
            {battles.map(battle => (
              <div key={battle.id} className="battle-card">
                <div className="battle-card-header">
                  <h3>{battle.title || 'Battle'}</h3>
                  <span className="status-badge">Puanlama Bekliyor</span>
                </div>

                <div className="battle-card-body">
                  <div className="participants">
                    <span className="participant">{battle.initiator?.name}</span>
                    <span className="vs">⚔️ VS ⚔️</span>
                    <span className="participant">{battle.challenged?.name}</span>
                  </div>

                  {battle.selectedStudio && (
                    <div className="battle-info">
                      🏢 {battle.selectedStudio.name}
                    </div>
                  )}

                  {battle.scheduledDate && (
                    <div className="battle-info">
                      📅 {new Date(battle.scheduledDate).toLocaleDateString('tr-TR')}
                    </div>
                  )}
                </div>

                <button
                  className="btn-score"
                  onClick={() => setSelectedBattle(battle)}
                >
                  🎯 Puanlama Yap
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .referee-panel {
          min-height: 100vh;
          background: linear-gradient(135deg, #1a1a1a 0%, #2d1a1a 100%);
          color: #fff;
          padding: 2rem;
        }

        .panel-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .back-btn {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 12px;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.3s;
        }

        .back-btn:hover {
          background: rgba(255,255,255,0.15);
        }

        .panel-title {
          font-size: 2rem;
          margin: 0;
        }

        .stats-card {
          display: flex;
          justify-content: center;
          margin-bottom: 3rem;
        }

        .stat {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 2rem;
          text-align: center;
          min-width: 200px;
        }

        .stat-icon {
          font-size: 3rem;
          margin-bottom: 0.5rem;
        }

        .stat-value {
          font-size: 3rem;
          font-weight: bold;
          color: #FF3B30;
          margin-bottom: 0.5rem;
        }

        .stat-label {
          font-size: 0.9rem;
          color: #b0b0b0;
        }

        .battles-section h2 {
          margin-bottom: 1.5rem;
        }

        .empty-state {
          background: rgba(255,255,255,0.05);
          border: 2px dashed rgba(255,255,255,0.2);
          border-radius: 16px;
          padding: 4rem;
          text-align: center;
        }

        .empty-icon {
          font-size: 5rem;
          margin-bottom: 1rem;
        }

        .battles-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
        }

        .battle-card {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 1.5rem;
          transition: all 0.3s;
        }

        .battle-card:hover {
          background: rgba(255,255,255,0.08);
          transform: translateY(-2px);
        }

        .battle-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .battle-card-header h3 {
          margin: 0;
          font-size: 1.2rem;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.85rem;
          background: rgba(245,158,11,0.2);
          color: #fbbf24;
        }

        .battle-card-body {
          margin-bottom: 1.5rem;
        }

        .participants {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .participant {
          font-weight: 600;
          color: #FF3B30;
        }

        .vs {
          color: #b0b0b0;
        }

        .battle-info {
          text-align: center;
          margin: 0.5rem 0;
          color: #b0b0b0;
          font-size: 0.9rem;
        }

        .btn-score {
          background: linear-gradient(90deg, #FF3B30, #d42b20);
          border: none;
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 600;
          width: 100%;
          transition: all 0.3s;
        }

        .btn-score:hover {
          box-shadow: 0 6px 20px rgba(255,59,48,0.3);
          transform: translateY(-1px);
        }

        @media (max-width: 768px) {
          .battles-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default RefereePanel;
