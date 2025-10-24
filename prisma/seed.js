// Prisma Seed Script
// Mock data oluşturur: kullanıcılar, stüdyolar, battle talepleri

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Şifre hash'leme
  const hashedPassword = await bcrypt.hash('password123', 10);
  const adminPassword = await bcrypt.hash('admin123', 10);

  // 1. Admin oluştur
  const admin = await prisma.user.upsert({
    where: { email: 'admin@moveleague.com' },
    update: {},
    create: {
      email: 'admin@moveleague.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin created:', admin.email);

  // 2. Dansçılar oluştur
  const dancer1 = await prisma.user.upsert({
    where: { email: 'dancer1@test.com' },
    update: {},
    create: {
      email: 'dancer1@test.com',
      name: 'Ahmet Yıldız',
      password: hashedPassword,
      role: 'DANCER',
      danceStyles: ['hiphop', 'breaking'],
      experience: 5,
      bio: 'Profesyonel Hip Hop ve Breaking dansçısı',
    },
  });

  const dancer2 = await prisma.user.upsert({
    where: { email: 'dancer2@test.com' },
    update: {},
    create: {
      email: 'dancer2@test.com',
      name: 'Zeynep Kaya',
      password: hashedPassword,
      role: 'DANCER',
      danceStyles: ['hiphop', 'house'],
      experience: 3,
      bio: 'Hip Hop ve House uzmanı',
    },
  });

  const dancer3 = await prisma.user.upsert({
    where: { email: 'dancer3@test.com' },
    update: {},
    create: {
      email: 'dancer3@test.com',
      name: 'Mehmet Demir',
      password: hashedPassword,
      role: 'DANCER',
      danceStyles: ['breaking', 'popping'],
      experience: 7,
      bio: 'Breaking champion 2023',
    },
  });

  console.log('✅ Dancers created:', dancer1.email, dancer2.email, dancer3.email);

  // 3. Stüdyolar oluştur
  const studioUser1 = await prisma.user.upsert({
    where: { email: 'studio1@test.com' },
    update: {},
    create: {
      email: 'studio1@test.com',
      name: 'Adana Dans Stüdyosu',
      password: hashedPassword,
      role: 'STUDIO',
      studioName: 'Adana Dans Stüdyosu',
      address: 'Seyhan, Ziya Algan İş Merkezi, Adana',
      phone: '+90 322 123 4567',
    },
  });

  const studio1 = await prisma.studio.upsert({
    where: { userId: studioUser1.id },
    update: {},
    create: {
      userId: studioUser1.id,
      name: 'Adana Dans Stüdyosu',
      address: 'Seyhan, Ziya Algan İş Merkezi, Adana',
      city: 'Adana',
      phone: '+90 322 123 4567',
      email: 'studio1@test.com',
      capacity: 50,
      pricePerHour: 200,
      facilities: ['mirrors', 'sound system', 'air conditioning', 'changing rooms'],
      description: 'Adana\'nın en büyük dans stüdyosu',
      workingHours: {
        monday: '09:00-22:00',
        tuesday: '09:00-22:00',
        wednesday: '09:00-22:00',
        thursday: '09:00-22:00',
        friday: '09:00-23:00',
        saturday: '10:00-23:00',
        sunday: '10:00-20:00',
      },
    },
  });

  const studioUser2 = await prisma.user.upsert({
    where: { email: 'studio2@test.com' },
    update: {},
    create: {
      email: 'studio2@test.com',
      name: 'Merkez Park Stüdyo',
      password: hashedPassword,
      role: 'STUDIO',
      studioName: 'Merkez Park Dans Stüdyosu',
      address: 'Çukurova, Merkez Park, Adana',
      phone: '+90 322 987 6543',
    },
  });

  const studio2 = await prisma.studio.upsert({
    where: { userId: studioUser2.id },
    update: {},
    create: {
      userId: studioUser2.id,
      name: 'Merkez Park Dans Stüdyosu',
      address: 'Çukurova, Merkez Park, Adana',
      city: 'Adana',
      phone: '+90 322 987 6543',
      email: 'studio2@test.com',
      capacity: 30,
      pricePerHour: 150,
      facilities: ['mirrors', 'sound system', 'wooden floor'],
      description: 'Merkez Park içinde modern stüdyo',
      workingHours: {
        monday: '10:00-21:00',
        tuesday: '10:00-21:00',
        wednesday: '10:00-21:00',
        thursday: '10:00-21:00',
        friday: '10:00-22:00',
        saturday: '11:00-22:00',
        sunday: 'closed',
      },
    },
  });

  const studioUser3 = await prisma.user.upsert({
    where: { email: 'studio3@test.com' },
    update: {},
    create: {
      email: 'studio3@test.com',
      name: 'Urban Dance Academy',
      password: hashedPassword,
      role: 'STUDIO',
      studioName: 'Urban Dance Academy',
      address: 'Yüreğir, Kışla Caddesi, Adana',
      phone: '+90 322 555 1234',
    },
  });

  const studio3 = await prisma.studio.upsert({
    where: { userId: studioUser3.id },
    update: {},
    create: {
      userId: studioUser3.id,
      name: 'Urban Dance Academy',
      address: 'Yüreğir, Kışla Caddesi, Adana',
      city: 'Adana',
      phone: '+90 322 555 1234',
      email: 'studio3@test.com',
      capacity: 40,
      pricePerHour: 180,
      facilities: ['mirrors', 'professional sound', 'LED lighting', 'lockers'],
      description: 'Hip hop ve urban dans odaklı stüdyo',
      workingHours: {
        monday: '08:00-23:00',
        tuesday: '08:00-23:00',
        wednesday: '08:00-23:00',
        thursday: '08:00-23:00',
        friday: '08:00-00:00',
        saturday: '10:00-00:00',
        sunday: '12:00-22:00',
      },
    },
  });

  console.log('✅ Studios created:', studio1.name, studio2.name, studio3.name);

  // 4. Örnek Battle Talebi oluştur (PENDING durumunda)
  const battle1 = await prisma.battleRequest.create({
    data: {
      initiatorId: dancer1.id,
      challengedId: dancer2.id,
      title: 'Hip Hop Battle Challenge',
      category: 'hiphop',
      description: 'Hadi bir battle atalım!',
      status: 'PENDING',
    },
  });

  // 5. Dansçı 2'ye bildirim gönder
  await prisma.notification.create({
    data: {
      userId: dancer2.id,
      type: 'BATTLE_REQUEST',
      title: 'Yeni Battle Talebi',
      message: `${dancer1.name} sana bir battle talebi gönderdi!`,
      battleRequestId: battle1.id,
      isRead: false,
    },
  });

  console.log('✅ Sample battle request created');

  // 6. Eğitmenler oluştur
  const instructor1 = await prisma.user.upsert({
    where: { email: 'instructor1@test.com' },
    update: {},
    create: {
      email: 'instructor1@test.com',
      name: 'Emre Demir',
      password: hashedPassword,
      role: 'INSTRUCTOR',
      danceStyles: ['contemporary', 'ballet'],
      experience: 10,
      bio: 'Contemporary ve Bale uzmanı, 10 yıllık öğretim deneyimi',
    },
  });

  const instructor2 = await prisma.user.upsert({
    where: { email: 'instructor2@test.com' },
    update: {},
    create: {
      email: 'instructor2@test.com',
      name: 'Selin Arslan',
      password: hashedPassword,
      role: 'INSTRUCTOR',
      danceStyles: ['hiphop', 'street'],
      experience: 8,
      bio: 'Hip Hop ve Street Dance eğitmeni',
    },
  });

  console.log('✅ Instructors created');

  // 7. Workshop'lar oluştur
  const workshop1 = await prisma.workshop.create({
    data: {
      title: 'Modern Contemporary Workshop',
      instructorId: instructor1.id,
      category: 'contemporary',
      level: 'intermediate',
      description: 'Modern contemporary dans tekniklerini öğreneceğiniz kapsamlı bir workshop. Beden farkındalığı, zemin çalışmaları ve koreografi üzerine yoğunlaşacağız.',
      requirements: 'Temel dans deneyimi, rahat giysi, çıplak ayak veya dans ayakkabısı',
      videoUrl: 'https://example.com/videos/contemporary-intro.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400',
      scheduledDate: new Date('2025-11-15'),
      scheduledTime: '14:00',
      duration: 120,
      location: 'Dance Studio A',
      address: 'Seyhan, Ziya Algan İş Merkezi, Adana',
      capacity: 20,
      currentParticipants: 8,
      price: 350.00,
      isActive: true,
      isCancelled: false,
    },
  });

  const workshop2 = await prisma.workshop.create({
    data: {
      title: 'Hip Hop Foundations',
      instructorId: instructor2.id,
      category: 'hiphop',
      level: 'beginner',
      description: 'Hip Hop dansına sıfırdan başlayanlar için temel adımlar ve groove çalışması. Eğlenceli ve enerjik bir ortamda dans etmeyi öğrenin!',
      requirements: 'Herhangi bir deneyim gerekmez, rahat spor kıyafetler',
      videoUrl: 'https://example.com/videos/hiphop-basics.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1547153760-18fc9498041e?w=400',
      scheduledDate: new Date('2025-11-20'),
      scheduledTime: '18:00',
      duration: 90,
      location: 'Urban Dance Studio',
      address: 'Çukurova, Turhan Cemal Beriker Blv., Adana',
      capacity: 25,
      currentParticipants: 15,
      price: 250.00,
      isActive: true,
      isCancelled: false,
    },
  });

  const workshop3 = await prisma.workshop.create({
    data: {
      title: 'Advanced Contemporary Choreography',
      instructorId: instructor1.id,
      category: 'contemporary',
      level: 'advanced',
      description: 'İleri seviye dansçılar için karmaşık koreografi ve kompozisyon çalışması. Kendi hareket dilinizi keşfedin.',
      requirements: 'En az 3 yıl contemporary dans deneyimi',
      videoUrl: 'https://example.com/videos/advanced-contemporary.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=400',
      scheduledDate: new Date('2025-12-01'),
      scheduledTime: '10:00',
      duration: 180,
      location: 'Professional Dance Hall',
      address: 'Seyhan, Fuzuli Cd., Adana',
      capacity: 15,
      currentParticipants: 12,
      price: 500.00,
      isActive: true,
      isCancelled: false,
    },
  });

  const workshop4 = await prisma.workshop.create({
    data: {
      title: 'Street Dance Battle Prep',
      instructorId: instructor2.id,
      category: 'street',
      level: 'intermediate',
      description: 'Battle\'a hazırlık: Freestyle teknikleri, müzikalite ve sahne performansı. Kendinizi battle ortamında nasıl ifade edeceğinizi öğrenin.',
      requirements: 'Temel hip hop bilgisi, yüksek enerji',
      videoUrl: 'https://example.com/videos/battle-prep.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1504609773096-104ff2df19b8?w=400',
      scheduledDate: new Date('2025-11-25'),
      scheduledTime: '16:00',
      duration: 150,
      location: 'Street Dance Arena',
      address: 'Yüreğir, İnönü Cd., Adana',
      capacity: 30,
      currentParticipants: 5,
      price: 300.00,
      isActive: true,
      isCancelled: false,
    },
  });

  console.log('✅ Workshops created:', [workshop1, workshop2, workshop3, workshop4].map(w => w.title));

  console.log('\n🎉 Seeding completed successfully!');
  console.log('\n📋 Test Accounts:');
  console.log('Admin: admin@moveleague.com / admin123');
  console.log('Dancer 1: dancer1@test.com / password123');
  console.log('Dancer 2: dancer2@test.com / password123');
  console.log('Dancer 3: dancer3@test.com / password123');
  console.log('Instructor 1: instructor1@test.com / password123');
  console.log('Instructor 2: instructor2@test.com / password123');
  console.log('Studio 1: studio1@test.com / password123');
  console.log('Studio 2: studio2@test.com / password123');
  console.log('Studio 3: studio3@test.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
