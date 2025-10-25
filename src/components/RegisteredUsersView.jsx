import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api-client';

const RegisteredUsersView = ({ onBackClick }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, dancer, instructor, studio, judge
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('🔄 RegisteredUsersView: Kullanıcılar yükleniyor...');
      const data = await apiRequest('/users/all');
      console.log('✅ RegisteredUsersView: API yanıtı:', data);
      console.log('📊 RegisteredUsersView: Kullanıcı sayısı:', data.users?.length || 0);
      setUsers(data.users || []);
    } catch (error) {
      console.error('❌ RegisteredUsersView: Kullanıcı yükleme hatası:', error);
      alert('Kullanıcılar yüklenemedi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredUsers = () => {
    let filtered = users;

    // Role filter
    if (filter !== 'all') {
      filtered = filtered.filter(u => u.role.toLowerCase() === filter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(u => 
        u.name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        (u.danceStyles && u.danceStyles.some(style => style.toLowerCase().includes(query)))
      );
    }

    return filtered;
  };

  const getRoleConfig = (role) => {
    const configs = {
      DANCER: { icon: '💃', label: 'Dansçı', color: '#3b82f6', bgColor: 'rgba(59,130,246,0.2)' },
      INSTRUCTOR: { icon: '🎓', label: 'Eğitmen', color: '#dc2626', bgColor: 'rgba(220,38,38,0.2)' },
      STUDIO: { icon: '🏢', label: 'Stüdyo', color: '#8b5cf6', bgColor: 'rgba(139,92,246,0.2)' },
      JUDGE: { icon: '⚖️', label: 'Hakem', color: '#f59e0b', bgColor: 'rgba(245,158,11,0.2)' }
    };
    return configs[role] || { icon: '👤', label: role, color: '#6b7280', bgColor: 'rgba(107,114,128,0.2)' };
  };

  const getStatsByRole = () => {
    return {
      dancer: users.filter(u => u.role === 'DANCER').length,
      instructor: users.filter(u => u.role === 'INSTRUCTOR').length,
      studio: users.filter(u => u.role === 'STUDIO').length,
      judge: users.filter(u => u.role === 'JUDGE').length
    };
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
          <div style={{ fontSize: '48px', marginBottom: '20px', animation: 'spin 1s linear infinite' }}>👥</div>
          <p>Kullanıcılar yükleniyor...</p>
        </div>
      </div>
    );
  }

  const filteredUsers = getFilteredUsers();
  const stats = getStatsByRole();

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
        `}
      </style>

      {/* Header */}
      <div style={{
        maxWidth: '1400px',
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
          👥 Kayıtlı Kullanıcılar
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.6)' }}>
          Platformdaki tüm dansçıları, eğitmenleri, stüdyoları ve hakemleri görüntüleyin
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto 30px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px'
      }}>
        {[
          { role: 'dancer', label: 'Dansçı', icon: '💃', count: stats.dancer, color: '#3b82f6' },
          { role: 'instructor', label: 'Eğitmen', icon: '🎓', count: stats.instructor, color: '#dc2626' },
          { role: 'studio', label: 'Stüdyo', icon: '🏢', count: stats.studio, color: '#8b5cf6' },
          { role: 'judge', label: 'Hakem', icon: '⚖️', count: stats.judge, color: '#f59e0b' }
        ].map(stat => (
          <div
            key={stat.role}
            style={{
              background: `${stat.color}15`,
              border: `1px solid ${stat.color}40`,
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s',
              opacity: filter === stat.role ? 1 : 0.7
            }}
            onClick={() => setFilter(filter === stat.role ? 'all' : stat.role)}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = `0 5px 20px ${stat.color}40`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>{stat.icon}</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: stat.color, marginBottom: '5px' }}>
              {stat.count}
            </div>
            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Search Bar */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto 20px'
      }}>
        <input
          type="text"
          placeholder="🔍 Kullanıcı ara (isim, email, dans tarzı)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '15px 20px',
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '12px',
            color: 'white',
            fontSize: '14px',
            outline: 'none',
            transition: 'all 0.3s'
          }}
          onFocus={(e) => {
            e.target.style.background = 'rgba(255,255,255,0.15)';
            e.target.style.borderColor = 'rgba(220,38,38,0.4)';
          }}
          onBlur={(e) => {
            e.target.style.background = 'rgba(255,255,255,0.1)';
            e.target.style.borderColor = 'rgba(255,255,255,0.2)';
          }}
        />
      </div>

      {/* User Count */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto 20px',
        color: 'rgba(255,255,255,0.6)',
        fontSize: '14px'
      }}>
        {filteredUsers.length} kullanıcı bulundu
        {filter !== 'all' && ` (${getRoleConfig(filter.toUpperCase()).label})`}
        {searchQuery && ` - "${searchQuery}" araması için`}
      </div>

      {/* Users Grid */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        {filteredUsers.length === 0 ? (
          <div style={{
            gridColumn: '1 / -1',
            textAlign: 'center',
            padding: '60px 20px',
            color: 'rgba(255,255,255,0.4)'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔍</div>
            <p style={{ fontSize: '18px', marginBottom: '10px' }}>
              Kullanıcı bulunamadı
            </p>
            <p style={{ fontSize: '14px' }}>
              Arama kriterlerinizi değiştirmeyi deneyin
            </p>
          </div>
        ) : (
          filteredUsers.map(user => {
            const roleConfig = getRoleConfig(user.role);

            return (
              <div
                key={user.id}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '25px',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = `0 10px 30px ${roleConfig.color}40`;
                  e.currentTarget.style.borderColor = `${roleConfig.color}60`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                }}
              >
                {/* Avatar & Role Badge */}
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  marginBottom: '15px'
                }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${roleConfig.color} 0%, ${roleConfig.color}80 100%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '28px',
                    boxShadow: `0 4px 10px ${roleConfig.color}40`
                  }}>
                    {user.avatar || roleConfig.icon}
                  </div>

                  <div style={{
                    background: roleConfig.bgColor,
                    color: roleConfig.color,
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '600'
                  }}>
                    {roleConfig.label}
                  </div>
                </div>

                {/* Name */}
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  marginBottom: '8px',
                  color: 'white'
                }}>
                  {user.name}
                </h3>

                {/* Email */}
                <div style={{
                  fontSize: '13px',
                  color: 'rgba(255,255,255,0.6)',
                  marginBottom: '15px',
                  wordBreak: 'break-word'
                }}>
                  📧 {user.email}
                </div>

                {/* Dance Styles */}
                {user.danceStyles && user.danceStyles.length > 0 && (
                  <div style={{ marginBottom: '15px' }}>
                    <div style={{
                      fontSize: '11px',
                      color: 'rgba(255,255,255,0.5)',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '1px'
                    }}>
                      Dans Tarzları
                    </div>
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px'
                    }}>
                      {user.danceStyles.map((style, idx) => (
                        <span
                          key={idx}
                          style={{
                            background: 'rgba(220,38,38,0.2)',
                            border: '1px solid rgba(220,38,38,0.3)',
                            borderRadius: '6px',
                            padding: '3px 8px',
                            fontSize: '11px',
                            color: '#fca5a5'
                          }}
                        >
                          {style}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Experience */}
                {user.experience !== null && user.experience !== undefined && (
                  <div style={{
                    padding: '10px',
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.7)',
                    marginBottom: '10px'
                  }}>
                    ⭐ {user.experience} yıl deneyim
                  </div>
                )}

                {/* Rating (for dancers) */}
                {user.role === 'DANCER' && user.rating && (
                  <div style={{
                    padding: '10px',
                    background: 'rgba(220,38,38,0.1)',
                    border: '1px solid rgba(220,38,38,0.2)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.8)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>Battle Puanı (ELO)</span>
                    <span style={{
                      fontWeight: 'bold',
                      fontSize: '16px',
                      color: user.rating >= 1500 ? '#dc2626' : user.rating >= 1300 ? '#f59e0b' : '#9ca3af'
                    }}>
                      {user.rating}
                    </span>
                  </div>
                )}

                {/* Studio Info */}
                {user.role === 'STUDIO' && user.studioName && (
                  <div style={{
                    padding: '10px',
                    background: 'rgba(139,92,246,0.1)',
                    border: '1px solid rgba(139,92,246,0.2)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.8)'
                  }}>
                    🏢 {user.studioName}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RegisteredUsersView;
