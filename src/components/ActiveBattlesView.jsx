import React, { useState, useEffect } from 'react';
import { authApi } from '@/lib/api-client';

const ActiveBattlesView = ({ onBackClick }) => {
  const [battles, setBattles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, upcoming, today, past

  useEffect(() => {
    loadActiveBattles();
  }, []);

  const loadActiveBattles = async () => {
    try {
      setLoading(true);
      const data = await authApi.getActiveBattles();
      setBattles(data.battles || []);
    } catch (error) {
      console.error('Error loading active battles:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredBattles = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (filter) {
      case 'upcoming':
        return battles.filter(b => new Date(b.scheduledDate) > now);
      case 'today':
        return battles.filter(b => {
          const battleDate = new Date(b.scheduledDate);
          return battleDate.toDateString() === today.toDateString();
        });
      case 'past':
        return battles.filter(b => new Date(b.scheduledDate) < now);
      default:
        return battles;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      weekday: 'long'
    });
  };

  const getStatusBadge = (battle) => {
    const now = new Date();
    const battleDate = new Date(battle.scheduledDate);
    
    if (battleDate.toDateString() === now.toDateString()) {
      return { text: '🔴 BUGÜN', color: '#dc2626' };
    } else if (battleDate > now) {
      const daysUntil = Math.ceil((battleDate - now) / (1000 * 60 * 60 * 24));
      return { text: `📅 ${daysUntil} gün sonra`, color: '#f59e0b' };
    } else {
      return { text: '✓ Tamamlandı', color: '#6b7280' };
    }
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
          <div style={{ fontSize: '48px', marginBottom: '20px', animation: 'spin 1s linear infinite' }}>⚔️</div>
          <p>Aktif battle'lar yükleniyor...</p>
        </div>
      </div>
    );
  }

  const filteredBattles = getFilteredBattles();

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
          ⚔️ Aktif Battle'lar
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.6)' }}>
          Stüdyo tarafından onaylanmış tüm battle'ları görüntüleyin
        </p>
      </div>

      {/* Filters */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto 30px',
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap'
      }}>
        {[
          { id: 'all', label: 'Tümü', icon: '⚔️' },
          { id: 'today', label: 'Bugün', icon: '🔴' },
          { id: 'upcoming', label: 'Yaklaşan', icon: '📅' },
          { id: 'past', label: 'Geçmiş', icon: '✓' }
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            style={{
              background: filter === f.id 
                ? 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' 
                : 'rgba(255,255,255,0.1)',
              border: filter === f.id 
                ? '1px solid rgba(220,38,38,0.5)' 
                : '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px',
              padding: '10px 20px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: filter === f.id ? '600' : '400',
              transition: 'all 0.3s'
            }}
            onMouseEnter={(e) => {
              if (filter !== f.id) {
                e.target.style.background = 'rgba(220,38,38,0.2)';
              }
            }}
            onMouseLeave={(e) => {
              if (filter !== f.id) {
                e.target.style.background = 'rgba(255,255,255,0.1)';
              }
            }}
          >
            {f.icon} {f.label}
          </button>
        ))}
      </div>

      {/* Battle Count */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto 20px',
        color: 'rgba(255,255,255,0.6)',
        fontSize: '14px'
      }}>
        {filteredBattles.length} battle bulundu
      </div>

      {/* Battles Grid */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
        gap: '20px'
      }}>
        {filteredBattles.length === 0 ? (
          <div style={{
            gridColumn: '1 / -1',
            textAlign: 'center',
            padding: '60px 20px',
            color: 'rgba(255,255,255,0.4)'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>⚔️</div>
            <p style={{ fontSize: '18px', marginBottom: '10px' }}>
              {filter === 'today' ? 'Bugün battle yok' : 
               filter === 'upcoming' ? 'Yaklaşan battle yok' :
               filter === 'past' ? 'Geçmiş battle yok' :
               'Aktif battle bulunamadı'}
            </p>
            <p style={{ fontSize: '14px' }}>
              Stüdyo tarafından onaylanmış battle'lar burada görünecek
            </p>
          </div>
        ) : (
          filteredBattles.map(battle => {
            const status = getStatusBadge(battle);
            const isPast = new Date(battle.scheduledDate) < new Date();

            return (
              <div
                key={battle.id}
                style={{
                  background: isPast 
                    ? 'rgba(0,0,0,0.3)' 
                    : 'linear-gradient(135deg, rgba(220,38,38,0.1) 0%, rgba(0,0,0,0.3) 100%)',
                  backdropFilter: 'blur(10px)',
                  border: isPast 
                    ? '1px solid rgba(255,255,255,0.1)' 
                    : '1px solid rgba(220,38,38,0.2)',
                  borderRadius: '12px',
                  padding: '25px',
                  transition: 'all 0.3s',
                  opacity: isPast ? 0.7 : 1
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(220,38,38,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Status Badge */}
                <div style={{
                  display: 'inline-block',
                  background: `${status.color}20`,
                  color: status.color,
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '600',
                  marginBottom: '15px'
                }}>
                  {status.text}
                </div>

                {/* Title */}
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  marginBottom: '15px',
                  color: 'white'
                }}>
                  {battle.title}
                </h3>

                {/* Category */}
                <div style={{
                  display: 'inline-block',
                  background: 'rgba(220,38,38,0.2)',
                  border: '1px solid rgba(220,38,38,0.3)',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '12px',
                  marginBottom: '15px'
                }}>
                  {battle.category}
                </div>

                {/* Fighters */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '20px',
                  padding: '15px',
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '8px'
                }}>
                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      margin: '0 auto 8px'
                    }}>
                      {battle.initiator?.avatar || '🕺'}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '600' }}>
                      {battle.initiator?.name}
                    </div>
                  </div>

                  <div style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#dc2626',
                    padding: '0 20px'
                  }}>
                    VS
                  </div>

                  <div style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      margin: '0 auto 8px'
                    }}>
                      {battle.challenged?.avatar || '💃'}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: '600' }}>
                      {battle.challenged?.name}
                    </div>
                  </div>
                </div>

                {/* Date & Time */}
                <div style={{
                  padding: '12px',
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '8px',
                  marginBottom: '12px'
                }}>
                  <div style={{
                    fontSize: '13px',
                    color: 'rgba(255,255,255,0.8)',
                    marginBottom: '5px'
                  }}>
                    📅 {formatDate(battle.scheduledDate)}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: 'rgba(255,255,255,0.8)'
                  }}>
                    🕐 {battle.scheduledTime} • {battle.duration} dakika
                  </div>
                </div>

                {/* Location */}
                <div style={{
                  padding: '12px',
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: 'rgba(255,255,255,0.8)'
                }}>
                  📍 {battle.location}
                </div>

                {/* Studio Info */}
                {battle.selectedStudio && (
                  <div style={{
                    marginTop: '12px',
                    padding: '10px',
                    background: 'rgba(220,38,38,0.1)',
                    border: '1px solid rgba(220,38,38,0.2)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.7)'
                  }}>
                    🏢 {battle.selectedStudio.name}
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

export default ActiveBattlesView;
