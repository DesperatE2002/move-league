// Lig Test Verisi Seed Script
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedLeagues() {
  console.log('🏆 Lig test verileri oluşturuluyor...');

  try {
    // 1. Battle League Season oluştur
    const battleSeason = await prisma.battleLeagueSeason.create({
      data: {
        name: '2025 Bahar Sezonu',
        description: 'Move League ilk resmi battle ligi sezonu',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-06-30'),
        status: 'ACTIVE',
        prizeFirst: 10000,
        prizeSecond: 5000,
        prizeThird: 2500
      }
    });

    console.log('✅ Battle League Sezonu oluşturuldu:', battleSeason.name);

    // Kullanıcıları getir (dancer rolünde olanlar)
    const dancers = await prisma.user.findMany({
      where: { role: 'DANCER' },
      take: 20
    });

    // Battle League Rankings oluştur
    for (let i = 0; i < dancers.length; i++) {
      const dancer = dancers[i];
      const totalBattles = Math.floor(Math.random() * 30) + 10;
      const wins = Math.floor(totalBattles * (Math.random() * 0.6 + 0.2));
      const losses = Math.floor((totalBattles - wins) * (Math.random() * 0.8 + 0.1));
      const draws = totalBattles - wins - losses;
      const winRate = totalBattles > 0 ? (wins / totalBattles) * 100 : 0;
      const baseRating = 1200 + (wins - losses) * 20;
      const rating = Math.max(800, Math.min(2000, baseRating));

      await prisma.battleLeagueRanking.create({
        data: {
          seasonId: battleSeason.id,
          userId: dancer.id,
          dancerName: dancer.name,
          dancerAvatar: dancer.avatar,
          danceStyle: dancer.danceStyles[0] || 'hiphop',
          rating: rating,
          totalBattles: totalBattles,
          wins: wins,
          losses: losses,
          draws: draws,
          winRate: winRate,
          rank: i + 1
        }
      });
    }

    console.log(`✅ ${dancers.length} dansçı için Battle League sıralaması oluşturuldu`);

    // 2. Team League Season oluştur
    const teamSeason = await prisma.teamLeagueSeason.create({
      data: {
        name: '2025 Show Battle Championship',
        description: 'Takım battle için resmi lig',
        startDate: new Date('2025-01-15'),
        endDate: new Date('2025-07-15'),
        status: 'ACTIVE',
        minTeamMembers: 4,
        maxTeamMembers: 8,
        prizeFirst: 25000,
        prizeSecond: 15000,
        prizeThird: 8000
      }
    });

    console.log('✅ Team League Sezonu oluşturuldu:', teamSeason.name);

    // Takımlar oluştur
    const teamNames = [
      { name: 'Fire Crew', logo: '🔥' },
      { name: 'Thunder Squad', logo: '⚡' },
      { name: 'Phoenix Rising', logo: '🦅' },
      { name: 'Urban Legends', logo: '🌆' },
      { name: 'Street Kings', logo: '👑' },
      { name: 'Wild Style', logo: '🎨' },
      { name: 'Rhythm Nation', logo: '🎵' },
      { name: 'Break Masters', logo: '💪' }
    ];

    const teams = [];
    for (let i = 0; i < teamNames.length; i++) {
      const teamData = teamNames[i];
      const points = Math.floor(Math.random() * 50) + 10;
      const wins = Math.floor(points / 3);
      const losses = Math.floor(Math.random() * 8);
      const draws = Math.floor(Math.random() * 3);
      const totalScore = (Math.random() * 200) + 100;

      const team = await prisma.team.create({
        data: {
          name: teamData.name,
          logo: teamData.logo,
          motto: `${teamData.name} - Never give up!`,
          seasonId: teamSeason.id,
          points: points,
          wins: wins,
          losses: losses,
          draws: draws,
          totalScore: totalScore,
          rank: i + 1,
          isActive: true
        }
      });

      teams.push(team);

      // Her takıma 5-7 üye ekle
      const memberCount = Math.floor(Math.random() * 3) + 5;
      const availableDancers = dancers.slice(i * memberCount, (i + 1) * memberCount);
      
      for (let j = 0; j < availableDancers.length && j < memberCount; j++) {
        const dancer = availableDancers[j];
        await prisma.teamMember.create({
          data: {
            teamId: team.id,
            userId: dancer.id,
            role: j === 0 ? 'LEADER' : 'MEMBER'
          }
        });
      }
    }

    console.log(`✅ ${teams.length} takım oluşturuldu`);

    // Yaklaşan ve geçmiş maçlar oluştur
    const today = new Date();
    
    // Geçmiş maçlar (tamamlanmış)
    for (let i = 0; i < 10; i++) {
      const homeTeam = teams[Math.floor(Math.random() * teams.length)];
      let awayTeam = teams[Math.floor(Math.random() * teams.length)];
      while (awayTeam.id === homeTeam.id) {
        awayTeam = teams[Math.floor(Math.random() * teams.length)];
      }

      const homeScore = Math.random() * 100 + 50;
      const awayScore = Math.random() * 100 + 50;
      const winner = homeScore > awayScore ? 'home' : awayScore > homeScore ? 'away' : 'draw';

      const matchDate = new Date(today);
      matchDate.setDate(today.getDate() - Math.floor(Math.random() * 30) - 5);

      await prisma.teamMatch.create({
        data: {
          seasonId: teamSeason.id,
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam.id,
          scheduledDate: matchDate,
          location: `Studio ${Math.floor(Math.random() * 3) + 1}`,
          homeScore: parseFloat(homeScore.toFixed(1)),
          awayScore: parseFloat(awayScore.toFixed(1)),
          winner: winner,
          status: 'completed',
          judges: []
        }
      });
    }

    // Yaklaşan maçlar (planlanmış)
    for (let i = 0; i < 8; i++) {
      const homeTeam = teams[Math.floor(Math.random() * teams.length)];
      let awayTeam = teams[Math.floor(Math.random() * teams.length)];
      while (awayTeam.id === homeTeam.id) {
        awayTeam = teams[Math.floor(Math.random() * teams.length)];
      }

      const matchDate = new Date(today);
      matchDate.setDate(today.getDate() + Math.floor(Math.random() * 30) + 1);

      await prisma.teamMatch.create({
        data: {
          seasonId: teamSeason.id,
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam.id,
          scheduledDate: matchDate,
          location: `Studio ${Math.floor(Math.random() * 3) + 1}`,
          status: 'scheduled',
          judges: []
        }
      });
    }

    console.log('✅ Takım maçları oluşturuldu (10 geçmiş, 8 yaklaşan)');

    console.log('\n🎉 Lig test verileri başarıyla oluşturuldu!');

  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedLeagues();
