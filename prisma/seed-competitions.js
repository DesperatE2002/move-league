const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedCompetitions() {
  console.log('🎭 Seeding competitions...');

  try {
    // Admin kullanıcısını bul
    const admin = await prisma.user.findFirst({
      where: { email: 'admin@moveleague.com' }
    });

    if (!admin) {
      console.error('❌ Admin user not found!');
      return;
    }

    // Eğitmenleri bul
    const instructors = await prisma.user.findMany({
      where: { email: { contains: 'instructor' } },
      take: 3
    });

    // Dansçıları bul
    const dancers = await prisma.user.findMany({
      where: { email: { contains: 'dancer' } },
      take: 10
    });

    console.log(`✅ Found ${instructors.length} instructors and ${dancers.length} dancers`);

    // 1. Yaklaşan Yarışma (Kayıtlar açık)
    const now = new Date();
    const upcomingEvent = new Date();
    upcomingEvent.setDate(upcomingEvent.getDate() + 30); // 30 gün sonra

    const regStartUpcoming = new Date();
    regStartUpcoming.setDate(regStartUpcoming.getDate() - 2); // 2 gün önce başladı

    const regEndUpcoming = new Date(upcomingEvent);
    regEndUpcoming.setDate(regEndUpcoming.getDate() - 1); // 1 gün önce biter

    const songRevealUpcoming = new Date(upcomingEvent);
    songRevealUpcoming.setDate(songRevealUpcoming.getDate() - 1);
    songRevealUpcoming.setHours(12, 0, 0);

    const competition1 = await prisma.competition.create({
      data: {
        name: '2025 Bahar Dans Şöleni',
        eventDate: upcomingEvent,
        registrationStart: regStartUpcoming,
        registrationEnd: regEndUpcoming,
        songRevealDate: songRevealUpcoming,
        location: 'İstanbul',
        venue: 'Zorlu PSM',
        address: 'Levazım, Koru Sokağı No:2, 34340 Beşiktaş/İstanbul',
        description: 'Türkiye\'nin en büyük dans yarışması! Tüm dans stillerinden ekipler yarışacak.',
        rules: 'Minimum 4, maksimum 8 kişilik takımlar. Performans süresi 3-5 dakika.',
        minTeamMembers: 4,
        maxTeamMembers: 8,
        maxTeams: 20,
        prizeFirst: 50000,
        prizeSecond: 30000,
        prizeThird: 15000,
        judgeCount: 5,
        status: 'REGISTRATION_OPEN'
      }
    });

    console.log('✅ Created competition:', competition1.name);

    // Bu yarışma için 2 takım oluştur
    if (instructors.length >= 2) {
      const team1 = await prisma.competitionTeam.create({
        data: {
          competitionId: competition1.id,
          name: 'Fire Dancers',
          leaderId: instructors[0].id,
          status: 'FORMING',
          isApproved: true,
          members: {
            create: [
              {
                userId: instructors[0].id,
                role: 'LEADER'
              },
              ...dancers.slice(0, 3).map(dancer => ({
                userId: dancer.id,
                role: 'MEMBER'
              }))
            ]
          }
        }
      });

      const team2 = await prisma.competitionTeam.create({
        data: {
          competitionId: competition1.id,
          name: 'Urban Legends',
          leaderId: instructors[1].id,
          status: 'FORMING',
          isApproved: true,
          members: {
            create: [
              {
                userId: instructors[1].id,
                role: 'LEADER'
              },
              ...dancers.slice(4, 7).map(dancer => ({
                userId: dancer.id,
                role: 'MEMBER'
              }))
            ]
          }
        }
      });

      console.log('✅ Created teams:', team1.name, team2.name);

      // Bekleyen davet oluştur
      if (dancers.length > 7) {
        await prisma.competitionInvitation.create({
          data: {
            teamId: team1.id,
            senderId: instructors[0].id,
            receiverId: dancers[7].id,
            message: 'Fire Dancers takımına katılmanızı istiyoruz! 🔥',
            status: 'PENDING'
          }
        });

        // Bildirim oluştur
        await prisma.notification.create({
          data: {
            userId: dancers[7].id,
            type: 'COMPETITION_INVITATION',
            title: '💃 Takım Daveti',
            message: `${instructors[0].name} sizi ${team1.name} takımına davet etti!`,
            isRead: false
          }
        });

        console.log('✅ Created pending invitation');
      }
    }

    // 2. Gelecek Yarışma (Kayıtlar henüz açılmadı)
    const futureEvent = new Date();
    futureEvent.setDate(futureEvent.getDate() + 60);

    const regStartFuture = new Date(futureEvent);
    regStartFuture.setDate(regStartFuture.getDate() - 25);

    const regEndFuture = new Date(futureEvent);
    regEndFuture.setDate(regEndFuture.getDate() - 1);

    const songRevealFuture = new Date(futureEvent);
    songRevealFuture.setDate(songRevealFuture.getDate() - 1);
    songRevealFuture.setHours(12, 0, 0);

    const competition2 = await prisma.competition.create({
      data: {
        name: 'Adana Move Show Championship 2025',
        eventDate: futureEvent,
        registrationStart: regStartFuture,
        registrationEnd: regEndFuture,
        songRevealDate: songRevealFuture,
        location: 'Adana',
        venue: 'Adana Kongre Merkezi',
        address: 'Süleyman Demirel Blv., 01120 Seyhan/Adana',
        description: 'Adana\'nın en prestijli dans yarışması. Yerel ve ulusal ekiplerin katılımıyla.',
        rules: 'Profesyonel ve amatör kategoriler. Minimum 4, maksimum 8 kişilik takımlar.',
        minTeamMembers: 4,
        maxTeamMembers: 8,
        maxTeams: 15,
        prizeFirst: 35000,
        prizeSecond: 20000,
        prizeThird: 10000,
        judgeCount: 3,
        status: 'UPCOMING'
      }
    });

    console.log('✅ Created competition:', competition2.name);

    // 3. Geçmiş Yarışma (Tamamlanmış)
    const pastEvent = new Date();
    pastEvent.setDate(pastEvent.getDate() - 15);

    const regStartPast = new Date(pastEvent);
    regStartPast.setDate(regStartPast.getDate() - 20);

    const regEndPast = new Date(pastEvent);
    regEndPast.setDate(regEndPast.getDate() - 1);

    const songRevealPast = new Date(pastEvent);
    songRevealPast.setDate(songRevealPast.getDate() - 1);
    songRevealPast.setHours(12, 0, 0);

    const competition3 = await prisma.competition.create({
      data: {
        name: 'Kış Dans Festivali 2024',
        eventDate: pastEvent,
        registrationStart: regStartPast,
        registrationEnd: regEndPast,
        songRevealDate: songRevealPast,
        songTitle: 'Levitating',
        songArtist: 'Dua Lipa',
        songUrl: 'https://www.youtube.com/watch?v=TUVcZfQe-Kw',
        songRevealed: true,
        location: 'İzmir',
        venue: 'İzmir Fuar Alanı',
        address: 'Kültür Mahallesi, Atatürk Caddesi, 35220 Konak/İzmir',
        description: 'Kış sezonunun en büyük dans etkinliği.',
        rules: 'Tüm kategorilerde yarışma. Minimum 4, maksimum 8 kişilik takımlar.',
        minTeamMembers: 4,
        maxTeamMembers: 8,
        maxTeams: 25,
        prizeFirst: 40000,
        prizeSecond: 25000,
        prizeThird: 12000,
        judgeCount: 5,
        status: 'COMPLETED'
      }
    });

    console.log('✅ Created competition:', competition3.name);

    // Geçmiş yarışma için takımlar ve sonuçlar
    if (instructors.length >= 3) {
      const pastTeam1 = await prisma.competitionTeam.create({
        data: {
          competitionId: competition3.id,
          name: 'Victory Crew',
          leaderId: instructors[0].id,
          status: 'APPROVED',
          isApproved: true,
          finalScore: 95.5,
          rank: 1,
          members: {
            create: [
              {
                userId: instructors[0].id,
                role: 'LEADER'
              },
              ...dancers.slice(0, 5).map(dancer => ({
                userId: dancer.id,
                role: 'MEMBER'
              }))
            ]
          }
        }
      });

      const pastTeam2 = await prisma.competitionTeam.create({
        data: {
          competitionId: competition3.id,
          name: 'Rhythm Masters',
          leaderId: instructors[1].id,
          status: 'APPROVED',
          isApproved: true,
          finalScore: 92.8,
          rank: 2,
          members: {
            create: [
              {
                userId: instructors[1].id,
                role: 'LEADER'
              },
              ...dancers.slice(5, 9).map(dancer => ({
                userId: dancer.id,
                role: 'MEMBER'
              }))
            ]
          }
        }
      });

      console.log('✅ Created past competition teams with results');
    }

    console.log('\n🎉 Competition seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log('- Active competition (registration open): ' + competition1.name);
    console.log('- Upcoming competition: ' + competition2.name);
    console.log('- Completed competition: ' + competition3.name);

  } catch (error) {
    console.error('❌ Error seeding competitions:', error);
    throw error;
  }
}

async function main() {
  try {
    await seedCompetitions();
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
