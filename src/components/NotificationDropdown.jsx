"use client";

import React, { useState, useEffect } from 'react';
import { notificationsApi } from '@/lib/api-client';

const NotificationDropdown = ({ onBattleClick, onStudioApprovalClick }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNotifications();
    
    // Her 30 saniyede bir yenile
    const interval = setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationsApi.getNotifications();
      setNotifications(response.data.notifications || []);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (err) {
      console.error('Bildirimler yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await notificationsApi.markAsRead(id);
      await loadNotifications();
    } catch (err) {
      console.error('Bildirim işaretlenemedi:', err);
    }
  };

  const handleNotificationClick = async (notif) => {
    // Okunmamışsa okundu yap
    if (!notif.isRead) {
      await markAsRead(notif.id);
    }

    setIsOpen(false);

    // Stüdyo onay bildirimleri için studio-approval sayfasına yönlendir
    if (notif.type === 'STUDIO_REQUEST' && notif.battleRequestId && onStudioApprovalClick) {
      onStudioApprovalClick(notif.battleRequestId);
      return;
    }

    // Battle bildirimleri için battle detayına yönlendir
    if (notif.battleRequestId && onBattleClick) {
      onBattleClick(notif.battleRequestId);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      await loadNotifications();
    } catch (err) {
      console.error('Bildirimler işaretlenemedi:', err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'BATTLE_REQUEST':
        return '⚔️';
      case 'BATTLE_ACCEPTED':
        return '✅';
      case 'BATTLE_REJECTED':
        return '❌';
      case 'STUDIO_REQUEST':
        return '🏢';
      case 'STUDIO_CONFIRMED':
        return '✅';
      case 'STUDIO_REJECTED':
        return '❌';
      case 'BATTLE_SCHEDULED':
        return '📅';
      case 'COMPETITION_INVITATION':
        return '💃';
      case 'INVITATION_ACCEPTED':
        return '✅';
      case 'INVITATION_REJECTED':
        return '❌';
      case 'SONG_REVEALED':
        return '🎵';
      default:
        return '🔔';
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Şimdi';
    if (diffMins < 60) return `${diffMins} dakika önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays < 7) return `${diffDays} gün önce`;
    return date.toLocaleDateString('tr-TR');
  };

  return (
    <div className="notification-dropdown">
      <button 
        className="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
      >
        🔔
        {unreadCount > 0 && (
          <span className="badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="backdrop" onClick={() => setIsOpen(false)} />
          <div className="dropdown-panel">
            <div className="dropdown-header">
              <h3>Bildirimler</h3>
              {unreadCount > 0 && (
                <button 
                  className="mark-all-read"
                  onClick={markAllAsRead}
                >
                  Tümünü Okundu Yap
                </button>
              )}
            </div>

            <div className="notifications-list">
              {loading ? (
                <div className="loading-state">Yükleniyor...</div>
              ) : notifications.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📭</div>
                  <p>Henüz bildirim yok</p>
                </div>
              ) : (
                notifications.map(notif => (
                  <div
                    key={notif.id}
                    className={`notification-item ${!notif.isRead ? 'unread' : ''}`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className="notif-icon">
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div className="notif-content">
                      <h4 className="notif-title">{notif.title}</h4>
                      <p className="notif-message">{notif.message}</p>
                      <span className="notif-time">{formatDate(notif.createdAt)}</span>
                    </div>
                    {!notif.isRead && (
                      <div className="unread-dot" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        .notification-dropdown {
          position: relative;
        }

        .notification-bell {
          position: relative;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          cursor: pointer;
          transition: all 0.3s;
        }

        .notification-bell:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: scale(1.1);
        }

        .badge {
          position: absolute;
          top: -5px;
          right: -5px;
          background: #dc2626;
          color: white;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
        }

        .backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 999;
        }

        .dropdown-panel {
          position: absolute;
          top: 60px;
          right: 0;
          width: 400px;
          max-height: 600px;
          background: rgba(20, 20, 30, 0.98);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(20px);
          z-index: 1000;
          display: flex;
          flex-direction: column;
          animation: slideDown 0.3s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .dropdown-header {
          padding: 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .dropdown-header h3 {
          margin: 0;
          font-size: 1.25rem;
          color: white;
        }

        .mark-all-read {
          padding: 0.5rem 1rem;
          background: rgba(220, 38, 38, 0.2);
          border: 1px solid #dc2626;
          border-radius: 6px;
          color: #fca5a5;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.3s;
        }

        .mark-all-read:hover {
          background: rgba(220, 38, 38, 0.3);
        }

        .notifications-list {
          flex: 1;
          overflow-y: auto;
          max-height: 500px;
        }

        .notifications-list::-webkit-scrollbar {
          width: 8px;
        }

        .notifications-list::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }

        .notifications-list::-webkit-scrollbar-thumb {
          background: #dc2626;
          border-radius: 4px;
        }

        .loading-state, .empty-state {
          text-align: center;
          padding: 3rem 2rem;
          color: rgba(255, 255, 255, 0.6);
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .notification-item {
          display: flex;
          gap: 1rem;
          padding: 1rem 1.5rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          cursor: pointer;
          transition: all 0.3s;
          position: relative;
        }

        .notification-item:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .notification-item.unread {
          background: rgba(220, 38, 38, 0.1);
        }

        .notif-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .notif-content {
          flex: 1;
        }

        .notif-title {
          margin: 0 0 0.25rem 0;
          font-size: 1rem;
          font-weight: 600;
          color: white;
        }

        .notif-message {
          margin: 0 0 0.5rem 0;
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.8);
          line-height: 1.4;
        }

        .notif-time {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
        }

        .unread-dot {
          position: absolute;
          top: 50%;
          right: 1rem;
          transform: translateY(-50%);
          width: 10px;
          height: 10px;
          background: #dc2626;
          border-radius: 50%;
        }

        @media (max-width: 768px) {
          .dropdown-panel {
            width: 90vw;
            right: 5vw;
          }
        }
      `}</style>
    </div>
  );
};

export default NotificationDropdown;
