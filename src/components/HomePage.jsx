"use client";

import React from 'react';
import BattlesPage from './BattlesPage';
import BattleDetail from './BattleDetail';
import StudioSelection from './StudioSelection';
import StudioBattleApproval from './StudioBattleApproval';
import LeaguesView from './LeaguesView';
import WorkshopCreate from './WorkshopCreate';
import WorkshopsPage from './WorkshopsPage';
import WorkshopDetail from './WorkshopDetail';
import NotificationDropdown from './NotificationDropdown';
import ProfilePage from './ProfilePage';
import ActiveBattlesView from './ActiveBattlesView';
import RegisteredUsersView from './RegisteredUsersView';
import LeagueView from './LeagueView';
import CompetitionsView from './CompetitionsView';
import CompetitionCreateForm from './CompetitionCreateForm';
import CompetitionDetail from './CompetitionDetail';
import TeamCreate from './TeamCreate';
import DancerInvitations from './DancerInvitations';
import AdminPanel from './AdminPanel';
import RefereePanel from './RefereePanel';
import { authApi } from '@/lib/api-client';

/**
 * HomePage.jsx
 * Move League ana sayfa - giriş sonrası dashboard
 * - Hoş geldin mesajı
 * - Hızlı istatistikler
 * - Ana menü butonları
 */

const HomePage = ({ user = "Admin" }) => {
  const [activeSection, setActiveSection] = React.useState(null);
  const [selectedBattleId, setSelectedBattleId] = React.useState(null);
  const [selectedWorkshopId, setSelectedWorkshopId] = React.useState(null);
  const [selectedCompetitionId, setSelectedCompetitionId] = React.useState(null);
  const [viewingUser, setViewingUser] = React.useState(null); // AdminPanel'den profil görüntüleme için
  const [stats, setStats] = React.useState({
    battles: 0,
    users: 0,
    workshops: 0,
    competitions: 0
  });
  const currentUser = authApi.getCurrentUser();

  // İstatistikleri yükle
  React.useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const [battlesRes, usersRes, workshopsRes, competitionsRes] = await Promise.all([
        fetch('/api/battles', { headers }).then(r => r.json()).catch(() => ({ data: [] })),
        fetch('/api/users', { headers }).then(r => r.json()).catch(() => ({ data: [] })),
        fetch('/api/workshops', { headers }).then(r => r.json()).catch(() => ({ data: [] })),
        fetch('/api/competitions', { headers }).then(r => r.json()).catch(() => ({ data: [] }))
      ]);

      console.log('📊 Stats loaded:', {
        battles: battlesRes.data?.length,
        users: usersRes.data?.length,
        workshops: workshopsRes.data?.length,
        competitions: competitionsRes.data?.length
      });

      setStats({
        battles: battlesRes.data?.length || 0,
        users: usersRes.data?.length || 0,
        workshops: workshopsRes.data?.length || 0,
        competitions: competitionsRes.data?.length || 0
      });
    } catch (err) {
      console.error('İstatistik yükleme hatası:', err);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Çıkış yapmak istediğinize emin misiniz?')) {
      authApi.logout();
      window.location.reload();
    }
  };

  const handleMenuClick = (sectionId) => {
    setActiveSection(sectionId);
    setSelectedBattleId(null);
    setSelectedCompetitionId(null);
  };

  const handleBack = () => {
    setActiveSection(null);
    setSelectedBattleId(null);
    setSelectedCompetitionId(null);
    setViewingUser(null);
  };

  const handleViewUserProfile = (user) => {
    setViewingUser(user);
    setActiveSection('profile');
  };

  const handleCompetitionClick = (competitionId) => {
    setSelectedCompetitionId(competitionId);
    setActiveSection('competition-detail');
  };

  const handleBattleClick = (battleId) => {
    setSelectedBattleId(battleId);
    setActiveSection('battle-detail');
  };

  const handleStudioApprovalClick = (battleId) => {
    setSelectedBattleId(battleId);
    setActiveSection('studio-approval');
  };

  const handleWorkshopClick = (workshopId) => {
    setSelectedWorkshopId(workshopId);
    setActiveSection('workshop-detail');
  };

  const handleCreateWorkshop = () => {
    setActiveSection('workshop-create');
  };

  const handleWorkshopSuccess = () => {
    setActiveSection('workshops');
  };

  // Hash değişikliğini dinle (stüdyo seçimi için)
  React.useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#studio-select-')) {
        const battleId = hash.replace('#studio-select-', '');
        setSelectedBattleId(battleId);
        setActiveSection('studio-selection');
        window.location.hash = ''; // Hash'i temizle
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // İlk yüklemede kontrol et

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Eğer bir bölüm seçildiyse, o bölümü render et
  if (activeSection === 'battles') {
    return <BattlesPage onBack={handleBack} onBattleClick={handleBattleClick} />;
  }
  if (activeSection === 'battle-detail' && selectedBattleId) {
    return <BattleDetail battleId={selectedBattleId} onBack={handleBack} />;
  }
  if (activeSection === 'studio-selection' && selectedBattleId) {
    return <StudioSelection battleId={selectedBattleId} onBack={handleBack} onComplete={handleBack} />;
  }
  if (activeSection === 'studio-approval' && selectedBattleId) {
    return <StudioBattleApproval battleId={selectedBattleId} onBack={handleBack} />;
  }
  if (activeSection === 'leagues') {
    return <LeaguesView onBack={handleBack} />;
  }
  if (activeSection === 'workshops') {
    return <WorkshopsPage onBack={handleBack} onWorkshopClick={handleWorkshopClick} onCreateClick={handleCreateWorkshop} />;
  }
  if (activeSection === 'workshop-detail' && selectedWorkshopId) {
    return <WorkshopDetail workshopId={selectedWorkshopId} onBack={handleBack} />;
  }
  if (activeSection === 'workshop-create') {
    return <WorkshopCreate onBack={handleBack} onSuccess={handleWorkshopSuccess} />;
  }
  if (activeSection === 'profile') {
    return <ProfilePage currentUser={currentUser} onBackClick={handleBack} viewingUser={viewingUser} />;
  }
  if (activeSection === 'active-battles') {
    return <ActiveBattlesView onBackClick={handleBack} />;
  }
  if (activeSection === 'registered-users') {
    return <RegisteredUsersView onBackClick={handleBack} />;
  }
  if (activeSection === 'league-view') {
    return <LeagueView onBackClick={handleBack} />;
  }
  if (activeSection === 'competitions-view') {
    return <CompetitionsView 
      onBackClick={handleBack} 
      onCompetitionClick={handleCompetitionClick} 
      onCreateClick={() => setActiveSection('competition-create')}
      userRole={currentUser?.role} 
    />;
  }
  if (activeSection === 'competition-detail' && selectedCompetitionId) {
    return <CompetitionDetail 
      competitionId={selectedCompetitionId} 
      onBackClick={handleBack} 
      userRole={currentUser?.role} 
      currentUserId={currentUser?.id}
      onCreateTeam={(compId) => {
        setSelectedCompetitionId(compId);
        setActiveSection('team-create');
      }}
      onViewInvitations={() => setActiveSection('dancer-invitations')}
    />;
  }
  if (activeSection === 'competition-create') {
    return <CompetitionCreateForm onBackClick={handleBack} onSuccess={() => { handleBack(); setActiveSection('competitions-view'); }} />;
  }
  if (activeSection === 'team-create' && selectedCompetitionId) {
    return <TeamCreate competitionId={selectedCompetitionId} onBackClick={handleBack} onSuccess={() => { handleBack(); setActiveSection('competition-detail'); }} />;
  }
  if (activeSection === 'dancer-invitations') {
    return <DancerInvitations onBackClick={handleBack} />;
  }
  if (activeSection === 'admin-panel') {
    return <AdminPanel onBack={handleBack} onViewUserProfile={handleViewUserProfile} />;
  }
  if (activeSection === 'referee-panel') {
    return <RefereePanel onBack={handleBack} />;
  }

  const statsCards = [
    { label: "Aktif Battle", value: stats.battles.toString(), icon: "⚔️", action: 'active-battles' },
    { label: "Kayıtlı Kullanıcı", value: stats.users.toString(), icon: "💃", action: 'registered-users' },
    { label: "Workshop", value: stats.workshops.toString(), icon: "🎓", action: 'workshops' },
    { label: "Yarışma", value: stats.competitions.toString(), icon: "🏆", action: 'competition' }
  ];

  const menuItems = [
    // Battle - Sadece DANCER için "yeni oluştur" özelliği var
    ...(currentUser?.role === 'DANCER' ? [{
      id: "battles",
      title: "Battle", 
      desc: "Battle'larını görüntüle ve yeni battle oluştur", 
      icon: "⚔️", 
      color: "#FF3B30",
      badge: "Yeni"
    }] : []),
    // STUDIO için Battle Yönetimi
    ...(currentUser?.role === 'STUDIO' ? [{
      id: "battles",
      title: "Battle Yönetimi", 
      desc: "Stüdyonuzdaki battle taleplerini yönetin", 
      icon: "🏢", 
      color: "#FF3B30",
      badge: null
    }] : []),
    // REFEREE için Battle Listesi (sadece görüntüleme + puanlama)
    ...(currentUser?.role === 'REFEREE' ? [{
      id: "battles",
      title: "Battle Listesi", 
      desc: "Görevlendirildiğiniz battle'ları görüntüleyin", 
      icon: "⚖️", 
      color: "#FF3B30",
      badge: null
    }] : []),
    { 
      id: "leagues",
      title: "Mevcut Ligleri Görüntüle", 
      desc: "Battle ve Takım liglerindeki sıralamaları incele", 
      icon: "🏆", 
      color: "#FF9500",
      badge: null,
      action: 'league-view'
    },
    { 
      id: "workshops",
      title: "Workshop", 
      desc: "Dans workshoplarını ve eğitim etkinliklerini görüntüle", 
      icon: "🎓", 
      color: "#5856D6",
      badge: "5"
    },
    { 
      id: "competition",
      title: "Move Shows", 
      desc: "Büyük dans gösterilerini ve etkinliklerini keşfet", 
      icon: "🎪", 
      color: "#34C759",
      badge: "3",
      action: 'competitions-view'
    },
    ...(currentUser?.role === 'ADMIN' ? [{
      id: "admin",
      title: "👑 Admin Paneli", 
      desc: "Battle yönetimi ve hakem ataması", 
      icon: "⚙️", 
      color: "#DC2626",
      badge: "Admin",
      action: 'admin-panel'
    }] : []),
    ...(currentUser?.role === 'REFEREE' ? [{
      id: "referee",
      title: "⚖️ Hakem Paneli", 
      desc: "Battle puanlama ve kazanan belirleme", 
      icon: "🎯", 
      color: "#8B5CF6",
      badge: "Hakem",
      action: 'referee-panel'
    }] : [])
  ];

  return (
    <div className="homepage-root">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="brand">
            <h1 className="brand-logo">Move League</h1>
            <span className="brand-tag">{currentUser?.name || user}</span>
          </div>
          <div className="header-actions">
            <NotificationDropdown 
              onBattleClick={handleBattleClick}
              onStudioApprovalClick={handleStudioApprovalClick}
            />
            <button 
              className="profile-btn" 
              onClick={() => setActiveSection('profile')}
              style={{
                background: 'linear-gradient(135deg, rgba(220,38,38,0.2) 0%, rgba(153,27,27,0.2) 100%)',
                border: '1px solid rgba(220,38,38,0.3)',
                borderRadius: '8px',
                padding: '8px 16px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              👤 Profilim
            </button>
            <button className="logout-btn" onClick={handleLogout}>
              Çıkış Yap →
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        <div className="container">
          {/* Welcome Section */}
          <section className="welcome-section animate-fade">
            <h2 className="welcome-title">Hoş Geldin, {currentUser?.name || user}! 👋</h2>
            <p className="welcome-subtitle">
              Dünyanın ilk sosyal dans ligine hoş geldin! Move League ile dans kariyerini zirveye taşı.
            </p>
          </section>

          {/* Stats Grid */}
          <section className="stats-grid animate-fade-delay">
            {statsCards.map((stat, index) => (
              <div 
                key={index} 
                className="stat-card"
                onClick={() => stat.action && setActiveSection(stat.action)}
                style={{ 
                  cursor: stat.action ? 'pointer' : 'default',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  if (stat.action) {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 10px 30px rgba(220,38,38,0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (stat.action) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }
                }}
              >
                <div className="stat-icon">{stat.icon}</div>
                <div className="stat-value">{stat.value}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </section>

          {/* Menu Grid */}
          <section className="menu-grid animate-fade-delay-2">
            {menuItems.map((item, index) => (
              <div 
                key={index} 
                className="menu-card" 
                style={{ '--accent-color': item.color }}
                onClick={() => handleMenuClick(item.action || item.id)}
              >
                {item.badge && <span className="menu-badge">{item.badge}</span>}
                <div className="menu-icon">{item.icon}</div>
                <h3 className="menu-title">{item.title}</h3>
                <p className="menu-desc">{item.desc}</p>
                <div className="menu-arrow">→</div>
              </div>
            ))}
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        © 2025 Move League — Powered by Berkay Şimşek
      </footer>

      <style jsx>{`
        /* Root */
        .homepage-root {
          font-family: 'Poppins', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
          min-height: 100vh;
          background: 
            linear-gradient(135deg, rgba(0, 0, 0, 0.85) 0%, rgba(40, 10, 10, 0.95) 100%),
            url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800"><text x="100" y="200" font-size="180" opacity="0.05" fill="%23fff">💃</text><text x="700" y="500" font-size="150" opacity="0.05" fill="%23fff">🕺</text><text x="300" y="600" font-size="120" opacity="0.04" fill="%23dc2626">♪</text><text x="900" y="300" font-size="140" opacity="0.04" fill="%23dc2626">♫</text></svg>');
          background-size: cover, 100% 100%;
          background-attachment: fixed;
          color: #fff;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .homepage-root::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: 
            radial-gradient(circle at 20% 30%, rgba(220, 38, 38, 0.25) 0%, transparent 40%),
            radial-gradient(circle at 80% 70%, rgba(220, 38, 38, 0.20) 0%, transparent 40%),
            radial-gradient(circle at 50% 50%, rgba(180, 20, 20, 0.15) 0%, transparent 50%);
          pointer-events: none;
          animation: pulse 8s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.7;
          }
          50% {
            opacity: 1;
          }
        }

        /* Header */
        .header {
          background: rgba(30, 10, 10, 0.85);
          backdrop-filter: blur(10px);
          border-bottom: 2px solid rgba(220, 38, 38, 0.2);
          padding: 1rem 0;
          position: sticky;
          top: 0;
          z-index: 100;
          box-shadow: 0 4px 20px rgba(220, 38, 38, 0.15);
        }

        .header-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .brand-logo {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 700;
          background: linear-gradient(135deg, #ff3b30 0%, #dc2626 50%, #991b1b 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: 0 0 30px rgba(255, 59, 48, 0.5);
          filter: drop-shadow(0 0 10px rgba(220, 38, 38, 0.4));
        }

        .brand-tag {
          background: linear-gradient(135deg, rgba(255, 59, 48, 0.25) 0%, rgba(220, 38, 38, 0.20) 100%);
          color: #ff5a50;
          padding: 0.3rem 0.8rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          border: 1px solid rgba(255, 59, 48, 0.3);
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .logout-btn {
          background: transparent;
          color: #fff;
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 0.6rem 1.2rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .logout-btn:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.3);
          transform: translateX(2px);
        }

        /* Main Content */
        .main-content {
          flex: 1;
          padding: 2rem 0;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
        }

        /* Welcome Section */
        .welcome-section {
          margin-bottom: 2rem;
        }

        .welcome-title {
          margin: 0;
          font-size: 2rem;
          font-weight: 700;
          color: #fff;
          margin-bottom: 0.5rem;
        }

        .welcome-subtitle {
          margin: 0;
          font-size: 1rem;
          color: #b0b0b0;
          font-weight: 300;
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: rgba(30, 30, 30, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 1.5rem;
          text-align: center;
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          background: rgba(40, 40, 40, 0.7);
          border-color: rgba(255, 59, 48, 0.3);
          transform: translateY(-4px);
        }

        .stat-icon {
          font-size: 2rem;
          margin-bottom: 0.5rem;
        }

        .stat-value {
          font-size: 1.8rem;
          font-weight: 700;
          color: #FF3B30;
          margin-bottom: 0.3rem;
        }

        .stat-label {
          font-size: 0.85rem;
          color: #b0b0b0;
          font-weight: 400;
        }

        /* Menu Grid */
        .menu-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .menu-card {
          background: 
            linear-gradient(135deg, rgba(30, 30, 30, 0.8) 0%, rgba(20, 5, 5, 0.7) 100%),
            radial-gradient(circle at top right, rgba(220, 38, 38, 0.1) 0%, transparent 70%);
          border: 1px solid rgba(220, 38, 38, 0.2);
          border-radius: 14px;
          padding: 2rem;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(10px);
        }

        .menu-card::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(220, 38, 38, 0.15) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .menu-badge {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: var(--accent-color);
          color: white;
          padding: 0.3rem 0.7rem;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 600;
          z-index: 10;
        }

        .menu-arrow {
          position: absolute;
          bottom: 1.5rem;
          right: 1.5rem;
          font-size: 1.5rem;
          color: var(--accent-color);
          opacity: 0;
          transform: translateX(-10px);
          transition: all 0.3s ease;
        }

        .menu-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--accent-color);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .menu-card:hover {
          background: 
            linear-gradient(135deg, rgba(40, 10, 10, 0.9) 0%, rgba(30, 5, 5, 0.85) 100%),
            radial-gradient(circle at top right, rgba(220, 38, 38, 0.25) 0%, transparent 70%);
          border-color: var(--accent-color);
          transform: translateY(-6px) scale(1.02);
          box-shadow: 
            0 12px 40px rgba(0, 0, 0, 0.4),
            0 0 30px rgba(220, 38, 38, 0.3);
        }

        .menu-card:hover::before {
          opacity: 1;
        }

        .menu-card:hover .menu-arrow {
          opacity: 1;
          transform: translateX(0);
        }

        .menu-card:active {
          transform: translateY(-4px) scale(0.98);
        }

        .menu-icon {
          font-size: 2.5rem;
          margin-bottom: 1rem;
        }

        .menu-title {
          margin: 0 0 0.5rem;
          font-size: 1.3rem;
          font-weight: 600;
          color: #fff;
        }

        .menu-desc {
          margin: 0;
          font-size: 0.9rem;
          color: #b0b0b0;
          font-weight: 300;
        }

        /* Footer */
        .footer {
          text-align: center;
          padding: 2rem;
          font-size: 0.85rem;
          color: #666;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        /* Animations */
        .animate-fade {
          animation: fadeUp 0.6s ease both;
        }

        .animate-fade-delay {
          animation: fadeUp 0.7s ease both 0.1s;
        }

        .animate-fade-delay-2 {
          animation: fadeUp 0.8s ease both 0.2s;
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Responsive */
        @media (max-width: 968px) {
          .menu-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .header-content {
            padding: 0 1rem;
          }

          .container {
            padding: 0 1rem;
          }

          .welcome-title {
            font-size: 1.5rem;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .menu-grid {
            grid-template-columns: 1fr;
          }

          .brand {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }

          .menu-card {
            padding: 1.5rem;
          }

          .menu-arrow {
            bottom: 1rem;
            right: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default HomePage;
