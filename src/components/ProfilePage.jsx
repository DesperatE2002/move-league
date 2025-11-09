import React, { useState, useEffect } from 'react';
import { authApi } from '@/lib/api-client';

const ProfilePage = ({ currentUser, onBackClick, viewingUser = null }) => {
  const [user, setUser] = useState(viewingUser || currentUser);
  const [enrolledWorkshops, setEnrolledWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  
  // Studio/Referee specific stats
  const [roleStats, setRoleStats] = useState({
    totalBattles: 0,
    completedBattles: 0,
    pendingBattles: 0,
    upcomingBattles: []
  });
  
  // Başka kullanıcının profilini mi görüntülüyoruz?
  const isViewingOther = viewingUser && viewingUser.id !== currentUser?.id;

  useEffect(() => {
    loadProfileData();
  }, [viewingUser?.id]);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      
      if (isViewingOther) {
        // Başka kullanıcının profilini görüntülüyoruz
        console.log('🔄 ProfilePage: Viewing another user profile:', viewingUser);
        setUser(viewingUser);
      } else {
        // Kendi profilimizi görüntülüyoruz
        console.log('🔄 ProfilePage: Fetching fresh user data...');
        const userData = await authApi.getCurrentUserFromAPI();
        console.log('✅ ProfilePage: Fresh user data:', userData);
        
        if (userData && userData.data && userData.data.user) {
          console.log('📊 ProfilePage: Updated rating:', userData.data.user.rating);
          setUser(userData.data.user);
          localStorage.setItem('user', JSON.stringify(userData.data.user));
        }
        
        // Get user's enrolled workshops
        const workshopsData = await authApi.getEnrolledWorkshops();
        setEnrolledWorkshops(workshopsData.workshops || workshopsData.data?.workshops || []);
        
        // Load role-specific stats
        await loadRoleStats();
      }
      
    } catch (error) {
      console.error('❌ ProfilePage: Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRoleStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // REFEREE veya STUDIO ise battle istatistiklerini çek
      if (user?.role === 'REFEREE' || user?.role === 'STUDIO') {
        const battlesRes = await fetch('/api/battles', { headers });
        const battlesData = await battlesRes.json();
        const battles = battlesData.data || battlesData || [];

        const total = battles.length;
        const completed = battles.filter(b => b.status === 'COMPLETED').length;
        const pending = battles.filter(b => 
          b.status === 'STUDIO_PENDING' || 
          b.status === 'CONFIRMED' || 
          b.status === 'BATTLE_SCHEDULED'
        ).length;
        const upcoming = battles.filter(b => 
          b.status === 'BATTLE_SCHEDULED' && 
          b.scheduledDate
        ).sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));

        setRoleStats({
          totalBattles: total,
          completedBattles: completed,
          pendingBattles: pending,
          upcomingBattles: upcoming
        });
      }
    } catch (error) {
      console.error('❌ Error loading role stats:', error);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Validation
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('Tüm alanları doldurmalısınız');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('Yeni şifre en az 6 karakter olmalı');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Yeni şifreler eşleşmiyor');
      return;
    }

    try {
      const data = await authApi.changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword
      );

      setPasswordSuccess('Şifreniz başarıyla değiştirildi');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setTimeout(() => {
        setShowPasswordChange(false);
        setPasswordSuccess('');
      }, 2000);
    } catch (error) {
      setPasswordError(error.message || 'Şifre değiştirme başarısız');
      console.error('Password change error:', error);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setAvatarError('Lütfen bir resim dosyası seçin');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setAvatarError('Resim boyutu 2MB\'dan küçük olmalı');
      return;
    }

    setUploadingAvatar(true);
    setAvatarError('');

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64String = reader.result;
          
          // Upload avatar
          const response = await authApi.uploadAvatar(base64String);
          
          // Update user state
          setUser(response.user);
          localStorage.setItem('user', JSON.stringify(response.user));
          
          setUploadingAvatar(false);
        } catch (error) {
          setAvatarError(error.message || 'Avatar yükleme başarısız');
          setUploadingAvatar(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setAvatarError('Dosya okuma hatası');
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!confirm('Profil fotoğrafınızı silmek istediğinizden emin misiniz?')) {
      return;
    }

    setUploadingAvatar(true);
    try {
      const response = await authApi.removeAvatar();
      setUser(response.user);
      localStorage.setItem('user', JSON.stringify(response.user));
    } catch (error) {
      setAvatarError(error.message || 'Avatar silme başarısız');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const getRatingColor = (rating) => {
    if (rating >= 1500) return '#dc2626'; // Red for high ratings
    if (rating >= 1300) return '#f59e0b'; // Orange for medium
    return '#6b7280'; // Gray for starting
  };

  const getBadgeEmoji = (badge) => {
    const badgeMap = {
      'first_battle': '⚔️',
      'first_win': '🏆',
      'streak_3': '🔥',
      'streak_5': '💥',
      'workshop_1': '📚',
      'workshop_5': '🎓',
      'workshop_10': '👑',
      'veteran': '🌟',
      'master': '💎'
    };
    return badgeMap[badge] || '🏅';
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #000000 0%, #1a0505 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '20px',
            animation: 'spin 1s linear infinite'
          }}>💃</div>
          <p>Profil yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #000000 0%, #1a0505 100%)',
      padding: '40px 20px',
      color: 'white'
    }}>
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>

      {/* Header */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        marginBottom: '40px'
      }}>
        <button
          onClick={onBackClick}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '8px',
            padding: '10px 20px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px',
            marginBottom: '20px',
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(220,38,38,0.2)';
            e.target.style.borderColor = 'rgba(220,38,38,0.4)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255,255,255,0.1)';
            e.target.style.borderColor = 'rgba(255,255,255,0.2)';
          }}
        >
          ← Geri Dön
        </button>

        <h1 style={{
          fontSize: '36px',
          fontWeight: 'bold',
          marginBottom: '10px',
          background: 'linear-gradient(to right, #dc2626, #991b1b)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          {isViewingOther ? `${user.name} - Profil` : 'Profilim'}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.6)' }}>
          {isViewingOther 
            ? `${user.name} kullanıcısının profil bilgilerini görüntülüyorsunuz` 
            : 'Hesap bilgilerinizi ve istatistiklerinizi görüntüleyin'}
        </p>
      </div>

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        {/* User Info Card */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '30px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: user.avatar && user.avatar.startsWith('data:image/') 
              ? `url(${user.avatar})` 
              : 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '36px',
            marginBottom: '20px',
            margin: '0 auto 20px',
            position: 'relative'
          }}>
            {!user.avatar || !user.avatar.startsWith('data:image/') ? '👤' : ''}
            
            {!isViewingOther && (
              <div style={{
                position: 'absolute',
                bottom: '-10px',
                right: '-10px',
                display: 'flex',
                gap: '5px'
              }}>
                <label htmlFor="avatar-upload" style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(220,38,38,0.9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: uploadingAvatar ? 'wait' : 'pointer',
                  border: '2px solid white',
                  fontSize: '14px',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                >
                  {uploadingAvatar ? '⏳' : '📷'}
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploadingAvatar}
                  style={{ display: 'none' }}
                />
                
                {user.avatar && (
                  <button
                    onClick={handleRemoveAvatar}
                    disabled={uploadingAvatar}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'rgba(220,38,38,0.9)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: uploadingAvatar ? 'wait' : 'pointer',
                      border: '2px solid white',
                      fontSize: '14px',
                      transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                  >
                    🗑️
                  </button>
                )}
              </div>
            )}
          </div>

          {avatarError && (
            <div style={{
              background: 'rgba(220,38,38,0.2)',
              border: '1px solid rgba(220,38,38,0.4)',
              borderRadius: '8px',
              padding: '10px',
              marginBottom: '15px',
              fontSize: '14px',
              textAlign: 'center'
            }}>
              {avatarError}
            </div>
          )}

          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            marginBottom: '15px',
            textAlign: 'center'
          }}>
            {user.name}
          </h2>

          <div style={{ marginBottom: '20px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '10px 0',
              borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>Email:</span>
              <span>{user.email}</span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '10px 0',
              borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>Rol:</span>
              <span style={{
                background: user.role === 'INSTRUCTOR' ? 'rgba(220,38,38,0.2)' : 'rgba(59,130,246,0.2)',
                padding: '2px 12px',
                borderRadius: '12px',
                fontSize: '12px'
              }}>
                {user.role === 'INSTRUCTOR' ? 'Eğitmen' : user.role === 'DANCER' ? 'Dansçı' : 'Stüdyo'}
              </span>
            </div>

            {user.danceStyles && user.danceStyles.length > 0 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '10px 0',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                alignItems: 'flex-start'
              }}>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>Tarzlar:</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', maxWidth: '60%', justifyContent: 'flex-end' }}>
                  {user.danceStyles.map((style, idx) => (
                    <span key={idx} style={{
                      background: 'rgba(220,38,38,0.2)',
                      padding: '2px 8px',
                      borderRadius: '8px',
                      fontSize: '11px'
                    }}>
                      {style}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {!isViewingOther && (
            <>
              <button
                onClick={() => setShowPasswordChange(!showPasswordChange)}
                style={{
                  width: '100%',
                  background: 'rgba(220,38,38,0.2)',
                  border: '1px solid rgba(220,38,38,0.4)',
                  borderRadius: '8px',
                  padding: '12px',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'rgba(220,38,38,0.3)';
                  e.target.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'rgba(220,38,38,0.2)';
                  e.target.style.transform = 'scale(1)';
                }}
              >
                {showPasswordChange ? 'Şifre Değiştirmeyi İptal Et' : '🔒 Şifre Değiştir'}
              </button>

              {showPasswordChange && (
            <form onSubmit={handlePasswordChange} style={{ marginTop: '20px' }}>
              <input
                type="password"
                placeholder="Mevcut Şifre"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  marginBottom: '10px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '14px'
                }}
              />
              <input
                type="password"
                placeholder="Yeni Şifre"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  marginBottom: '10px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '14px'
                }}
              />
              <input
                type="password"
                placeholder="Yeni Şifre (Tekrar)"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  marginBottom: '10px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '14px'
                }}
              />
              
              {passwordError && (
                <div style={{
                  padding: '10px',
                  background: 'rgba(220,38,38,0.2)',
                  border: '1px solid rgba(220,38,38,0.4)',
                  borderRadius: '6px',
                  color: '#fca5a5',
                  fontSize: '12px',
                  marginBottom: '10px'
                }}>
                  {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div style={{
                  padding: '10px',
                  background: 'rgba(34,197,94,0.2)',
                  border: '1px solid rgba(34,197,94,0.4)',
                  borderRadius: '6px',
                  color: '#86efac',
                  fontSize: '12px',
                  marginBottom: '10px'
                }}>
                  {passwordSuccess}
                </div>
              )}

              <button
                type="submit"
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '10px',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                Şifreyi Güncelle
              </button>
            </form>
              )}
            </>
          )}
        </div>

        {/* Rating Card - Only for DANCER role */}
        {user.role === 'DANCER' && (
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            padding: '30px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            textAlign: 'center'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '20px',
              color: 'rgba(255,255,255,0.8)'
            }}>
              Battle Puanı (ELO)
            </h3>

            <div style={{
              fontSize: '72px',
              fontWeight: 'bold',
              color: getRatingColor(user.rating || 1200),
              marginBottom: '10px',
              textShadow: `0 0 20px ${getRatingColor(user.rating || 1200)}40`
            }}>
              {user.rating || 1200}
            </div>

            <p style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: '14px',
              marginBottom: '20px'
            }}>
              {user.rating >= 1500 ? '🔥 Usta Dansçı' : 
               user.rating >= 1300 ? '⭐ Deneyimli Dansçı' : 
               '🌱 Yükselen Yıldız'}
            </p>

            <div style={{
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '8px',
              padding: '15px',
              marginTop: '20px'
            }}>
              <p style={{
                fontSize: '12px',
                color: 'rgba(255,255,255,0.6)',
                marginBottom: '5px'
              }}>
                Battle kazandıkça puanın artacak!
              </p>
              <p style={{
                fontSize: '12px',
                color: 'rgba(255,255,255,0.4)'
              }}>
                Başlangıç puanı: 1200
              </p>
            </div>
          </div>
        )}

        {/* Badges Card */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '30px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            marginBottom: '20px',
            color: 'rgba(255,255,255,0.8)'
          }}>
            🏆 Rozetlerim
          </h3>

          {user.badges && user.badges.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))',
              gap: '15px'
            }}>
              {user.badges.map((badge, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(220,38,38,0.1)',
                    border: '1px solid rgba(220,38,38,0.3)',
                    borderRadius: '8px',
                    padding: '15px',
                    textAlign: 'center',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(220,38,38,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ fontSize: '32px' }}>
                    {getBadgeEmoji(badge)}
                  </div>
                  <div style={{
                    fontSize: '10px',
                    color: 'rgba(255,255,255,0.6)',
                    marginTop: '5px'
                  }}>
                    {badge.replace(/_/g, ' ').toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: 'rgba(255,255,255,0.4)'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>🎯</div>
              <p>Henüz rozet kazanmadınız</p>
              <p style={{ fontSize: '12px', marginTop: '10px' }}>
                Battle'lara katılın ve workshop'lara kayıt olun!
              </p>
            </div>
          )}
        </div>

        {/* Enrolled Workshops Card */}
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '30px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          gridColumn: 'span 2'
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            marginBottom: '20px',
            color: 'rgba(255,255,255,0.8)'
          }}>
            📚 Kayıtlı Olduğum Workshop'lar
          </h3>

          {enrolledWorkshops.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '15px'
            }}>
              {enrolledWorkshops.map((enrollment) => (
                <div
                  key={enrollment.id}
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '15px',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(220,38,38,0.1)';
                    e.currentTarget.style.borderColor = 'rgba(220,38,38,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(0,0,0,0.3)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '10px'
                  }}>
                    <h4 style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      flex: 1
                    }}>
                      {enrollment.workshop?.title}
                    </h4>
                    {enrollment.isPaid && (
                      <span style={{
                        background: 'rgba(34,197,94,0.2)',
                        color: '#86efac',
                        padding: '2px 8px',
                        borderRadius: '8px',
                        fontSize: '10px'
                      }}>
                        ✓ Ödendi
                      </span>
                    )}
                  </div>

                  <div style={{
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.6)',
                    marginBottom: '5px'
                  }}>
                    📅 {new Date(enrollment.workshop?.scheduledDate).toLocaleDateString('tr-TR')}
                    {' '}
                    🕐 {enrollment.workshop?.scheduledTime}
                  </div>

                  <div style={{
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.6)',
                    marginBottom: '5px'
                  }}>
                    👤 {enrollment.workshop?.instructor?.name}
                  </div>

                  {enrollment.isAttended !== null && (
                    <div style={{
                      fontSize: '11px',
                      marginTop: '10px',
                      padding: '5px',
                      background: enrollment.isAttended ? 'rgba(34,197,94,0.2)' : 'rgba(220,38,38,0.2)',
                      borderRadius: '4px',
                      textAlign: 'center'
                    }}>
                      {enrollment.isAttended ? '✓ Katıldı' : '✗ Katılmadı'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: 'rgba(255,255,255,0.4)'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>📚</div>
              <p>Henüz hiçbir workshop'a kayıt olmadınız</p>
              <p style={{ fontSize: '12px', marginTop: '10px' }}>
                Workshop'lar sayfasından ilginizi çeken workshop'lara katılabilirsiniz
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
