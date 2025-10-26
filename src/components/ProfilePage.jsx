import React, { useState, useEffect } from 'react';
import { authApi } from '@/lib/api-client';

const ProfilePage = ({ currentUser, onBackClick }) => {
  const [user, setUser] = useState(currentUser);
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

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      console.log('🔄 ProfilePage: loadProfileData başladı');
      
      // Fresh user data çek (güncel rating için)
      const token = localStorage.getItem('token');
      console.log('🔑 Token var mı?', !!token);
      
      if (token) {
        console.log('📡 /api/auth/me çağrılıyor...');
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('📥 Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('✅ API yanıtı:', data);
          
          if (data.success && data.user) {
            console.log('⭐ Yeni rating:', data.user.rating);
            setUser(data.user);
            // localStorage'daki user'ı da güncelle
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            const updatedUser = { ...storedUser, rating: data.user.rating };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            console.log('💾 localStorage güncellendi');
          }
        } else {
          console.error('❌ API hatası:', response.status);
        }
      }
      
    } catch (error) {
      console.error('❌ ProfilePage error:', error);
    } finally {
      setLoading(false);
      console.log('✅ loadProfileData tamamlandı');
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
          Profilim
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.6)' }}>
          Hesap bilgilerinizi ve istatistiklerinizi görüntüleyin
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
            background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '36px',
            marginBottom: '20px',
            margin: '0 auto 20px'
          }}>
            {user.avatar || '👤'}
          </div>

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
