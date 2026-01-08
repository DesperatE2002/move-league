"use client";

import React, { useState, useEffect } from 'react';

const AdminPendingApprovals = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingUsers();
  }, []);

  const loadPendingUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/pending-approvals', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPendingUsers(data.data.pendingUsers || []);
      }
    } catch (error) {
      console.error('Load pending users error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    if (!confirm('Bu kullanıcıyı onaylamak istediğinizden emin misiniz?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/pending-approvals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, approved: true })
      });

      if (response.ok) {
        alert('✅ Kullanıcı onaylandı!');
        loadPendingUsers();
      } else {
        alert('❌ Onaylama başarısız oldu');
      }
    } catch (error) {
      console.error('Approve error:', error);
      alert('❌ Bir hata oluştu');
    }
  };

  const handleReject = async (userId) => {
    if (!confirm('Bu kullanıcıyı reddetmek istediğinizden emin misiniz? Hesabı silinecek!')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/pending-approvals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, approved: false })
      });

      if (response.ok) {
        alert('✅ Kullanıcı reddedildi ve silindi');
        loadPendingUsers();
      } else {
        alert('❌ Reddetme başarısız oldu');
      }
    } catch (error) {
      console.error('Reject error:', error);
      alert('❌ Bir hata oluştu');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#9aa0a6' }}>
        <p>Yükleniyor...</p>
      </div>
    );
  }

  if (pendingUsers.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '3rem',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <p style={{ color: '#9aa0a6', fontSize: '16px' }}>
          ✅ Onay bekleyen kullanıcı yok
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{ color: '#fff', margin: 0 }}>
          Onay Bekleyen Kullanıcılar ({pendingUsers.length})
        </h3>
      </div>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {pendingUsers.map((user) => (
          <div
            key={user.id}
            style={{
              background: 'rgba(255,165,0,0.05)',
              border: '1px solid rgba(255,165,0,0.2)',
              borderRadius: '12px',
              padding: '1.5rem',
              display: 'flex',
              gap: '1.5rem',
              alignItems: 'start'
            }}
          >
            {/* Avatar */}
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '12px',
              background: user.avatar ? `url(${user.avatar})` : 'linear-gradient(135deg, #FF3B30, #DC2626)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '24px',
              fontWeight: '600',
              flexShrink: 0
            }}>
              {!user.avatar && user.name.charAt(0).toUpperCase()}
            </div>

            {/* User Info */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <h4 style={{ color: '#fff', margin: 0 }}>{user.name}</h4>
                <span style={{
                  background: user.role === 'INSTRUCTOR' ? 'rgba(59,130,246,0.2)' : 'rgba(168,85,247,0.2)',
                  color: user.role === 'INSTRUCTOR' ? '#3B82F6' : '#A855F7',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  {user.role === 'INSTRUCTOR' ? '👨‍🏫 Eğitmen' : '⚖️ Hakem'}
                </span>
              </div>

              <p style={{ color: '#9aa0a6', fontSize: '14px', margin: '0 0 0.75rem 0' }}>
                📧 {user.email}
              </p>

              {user.phone && (
                <p style={{ color: '#9aa0a6', fontSize: '14px', margin: '0 0 0.75rem 0' }}>
                  📱 {user.phone}
                </p>
              )}

              {user.danceStyles && user.danceStyles.length > 0 && (
                <div style={{ marginBottom: '0.75rem' }}>
                  <p style={{ color: '#9aa0a6', fontSize: '12px', margin: '0 0 0.5rem 0' }}>
                    Dans Türleri:
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {user.danceStyles.map((style) => (
                      <span
                        key={style}
                        style={{
                          background: 'rgba(255,255,255,0.1)',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '20px',
                          fontSize: '11px',
                          color: '#fff'
                        }}
                      >
                        {style}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {user.experience && (
                <p style={{ color: '#9aa0a6', fontSize: '14px', margin: '0 0 0.75rem 0' }}>
                  📊 Deneyim: {user.experience} yıl
                </p>
              )}

              {user.bio && (
                <p style={{ color: '#9aa0a6', fontSize: '14px', margin: '0 0 0.75rem 0', fontStyle: 'italic' }}>
                  "{user.bio}"
                </p>
              )}

              <p style={{ color: '#666', fontSize: '12px', margin: 0 }}>
                Kayıt: {new Date(user.createdAt).toLocaleDateString('tr-TR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                onClick={() => handleApprove(user.id)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                ✅ Onayla
              </button>
              <button
                onClick={() => handleReject(user.id)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                ❌ Reddet
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminPendingApprovals;
