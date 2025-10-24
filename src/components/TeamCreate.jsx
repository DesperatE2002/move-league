import React, { useState, useEffect } from 'react';
import { authApi } from '@/lib/api-client';
import './TeamCreate.css';

const TeamCreate = ({ competitionId, onBackClick, onSuccess }) => {
  const [competition, setCompetition] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [dancers, setDancers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [myTeam, setMyTeam] = useState(null);
  const [invitations, setInvitations] = useState([]);

  useEffect(() => {
    loadCompetition();
    loadDancers();
  }, [competitionId]);

  useEffect(() => {
    if (myTeam) {
      loadInvitations();
    }
  }, [myTeam]);

  const loadCompetition = async () => {
    try {
      const response = await authApi.getCompetition(competitionId);
      setCompetition(response.competition);
      
      // Kullanıcının takımını bul
      const userTeam = response.competition.teams?.find(t => 
        t.leaderId === parseInt(localStorage.getItem('userId'))
      );
      setMyTeam(userTeam);
    } catch (err) {
      console.error('Yarışma yükleme hatası:', err);
    }
  };

  const loadDancers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (selectedStyle) params.danceStyle = selectedStyle;
      
      const response = await authApi.getDancers(params);
      setDancers(response.dancers || []);
    } catch (err) {
      console.error('Dansçı listesi yükleme hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadInvitations = async () => {
    // Backend'de team bazlı invitation listesi yok, bu yüzden notification sistemi kullanılmalı
    // Şimdilik boş bırakıyoruz, gerekirse eklenebilir
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDancers();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedStyle]);

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!teamName.trim()) {
      alert('⚠️ Takım adı gereklidir!');
      return;
    }

    try {
      setCreating(true);
      const response = await authApi.createCompetitionTeam({
        competitionId: parseInt(competitionId),
        name: teamName
      });
      
      alert('✅ Takım başarıyla oluşturuldu!');
      setMyTeam(response.team);
      setTeamName('');
      loadCompetition();
    } catch (err) {
      console.error('Takım oluşturma hatası:', err);
      alert('❌ Takım oluşturulamadı: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleInviteDancer = async (dancerId) => {
    if (!myTeam) {
      alert('⚠️ Önce bir takım oluşturmalısınız!');
      return;
    }

    const message = `${myTeam.name} takımına katılmanızı istiyorum! 🎭`;
    
    try {
      await authApi.sendTeamInvitation(myTeam.id, {
        receiverId: dancerId,
        message
      });
      
      alert('✅ Davet başarıyla gönderildi!');
    } catch (err) {
      console.error('Davet gönderme hatası:', err);
      alert('❌ Davet gönderilemedi: ' + err.message);
    }
  };

  const canCreateTeam = competition && !myTeam;
  const now = new Date();
  const canRegister = competition && 
    now >= new Date(competition.registrationStart) && 
    now <= new Date(competition.registrationEnd);

  if (!competition) {
    return <div className="team-create-loading">Yükleniyor...</div>;
  }

  return (
    <div className="team-create">
      <div className="team-create-header">
        <button onClick={onBackClick} className="back-button">← Geri</button>
        <div className="header-info">
          <h2>🎭 Takım Oluştur</h2>
          <p className="competition-name">{competition.name}</p>
        </div>
      </div>

      {!canRegister && (
        <div className="warning-message">
          ⚠️ Kayıt dönemi dışındasınız. Takım oluşturma ve davet gönderme kapalıdır.
        </div>
      )}

      {/* Takım Oluşturma */}
      {canCreateTeam && canRegister && (
        <div className="create-team-card">
          <h3>1️⃣ Takım Oluştur</h3>
          <form onSubmit={handleCreateTeam}>
            <div className="form-group">
              <label>Takım Adı *</label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="örn: Fire Dancers"
                required
                maxLength={50}
              />
            </div>
            <button type="submit" className="create-button" disabled={creating}>
              {creating ? 'Oluşturuluyor...' : '✅ Takımı Oluştur'}
            </button>
          </form>
        </div>
      )}

      {/* Mevcut Takım Bilgisi */}
      {myTeam && (
        <div className="my-team-card">
          <h3>👥 Takımınız</h3>
          <div className="team-info">
            <h4>{myTeam.name}</h4>
            <div className="team-stats">
              <span className="stat">
                👤 {myTeam.members?.length || 0} Üye
              </span>
              <span className="stat">
                📊 Min: {competition.minTeamMembers} - Max: {competition.maxTeamMembers}
              </span>
            </div>
            
            {myTeam.members && myTeam.members.length > 0 && (
              <div className="team-members-list">
                <strong>Takım Üyeleri:</strong>
                <ul>
                  {myTeam.members.map(member => (
                    <li key={member.userId}>
                      <span className="member-name">
                        {member.user?.name || 'İsimsiz'}
                        {member.role === 'LEADER' && ' 👑'}
                        {member.role === 'SUBSTITUTE' && ' 🔄'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {myTeam.members && myTeam.members.length < competition.minTeamMembers && (
              <div className="warning-text">
                ⚠️ En az {competition.minTeamMembers} üye olmalıdır. 
                Şu an {myTeam.members.length} üyeniz var.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dansçı Arama ve Davet */}
      {myTeam && canRegister && (
        <div className="dancers-section">
          <h3>2️⃣ Dansçı Ara ve Davet Gönder</h3>
          
          <div className="search-filters">
            <div className="search-box">
              <input
                type="text"
                placeholder="🔍 İsim veya email ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value)}
              className="style-filter"
            >
              <option value="">🎭 Tüm Stiller</option>
              <option value="Salsa">Salsa</option>
              <option value="Bachata">Bachata</option>
              <option value="Kizomba">Kizomba</option>
              <option value="Zouk">Zouk</option>
              <option value="Tango">Tango</option>
              <option value="Hip Hop">Hip Hop</option>
              <option value="Contemporary">Contemporary</option>
            </select>
          </div>

          {loading ? (
            <div className="dancers-loading">Dansçılar yükleniyor...</div>
          ) : (
            <div className="dancers-grid">
              {dancers.length > 0 ? (
                dancers.map(dancer => {
                  const isInTeam = myTeam.members?.some(m => m.userId === dancer.id);
                  const isFull = myTeam.members?.length >= competition.maxTeamMembers;
                  
                  return (
                    <div key={dancer.id} className="dancer-card">
                      <div className="dancer-avatar">
                        {dancer.avatar ? (
                          <img src={dancer.avatar} alt={dancer.name} />
                        ) : (
                          <div className="avatar-placeholder">
                            {dancer.name?.charAt(0).toUpperCase() || '?'}
                          </div>
                        )}
                      </div>
                      <div className="dancer-info">
                        <h4>{dancer.name}</h4>
                        <p className="dancer-email">{dancer.email}</p>
                        {dancer.danceStyles && dancer.danceStyles.length > 0 && (
                          <div className="dancer-styles">
                            {dancer.danceStyles.slice(0, 3).map((style, idx) => (
                              <span key={idx} className="style-tag">{style}</span>
                            ))}
                          </div>
                        )}
                        {dancer.experience && (
                          <p className="dancer-experience">📊 {dancer.experience}</p>
                        )}
                      </div>
                      <div className="dancer-actions">
                        {isInTeam ? (
                          <span className="in-team-badge">✅ Takımda</span>
                        ) : isFull ? (
                          <span className="disabled-badge">❌ Takım Dolu</span>
                        ) : (
                          <button
                            onClick={() => handleInviteDancer(dancer.id)}
                            className="invite-button"
                          >
                            📨 Davet Gönder
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="no-dancers">
                  {searchTerm || selectedStyle ? 
                    '🔍 Arama kriterlerine uygun dansçı bulunamadı' : 
                    '👤 Henüz kayıtlı dansçı bulunmuyor'}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!myTeam && !canCreateTeam && (
        <div className="info-message">
          ℹ️ Bu yarışmada zaten bir takımınız var veya takım oluşturma kapalı.
        </div>
      )}
    </div>
  );
};

export default TeamCreate;
