const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  console.log('🏢 Fenomen stüdyo hesabı oluşturuluyor...\n');

  const password = await bcrypt.hash('test123', 10);

  // Stüdyo kullanıcısı oluştur
  const studioUser = await prisma.user.create({
    data: {
      email: 'fenomen@test.com',
      password,
      name: 'Fenomen Dans',
      role: 'STUDIO',
      danceStyles: [],
    }
  });

  // Studio profili oluştur
  const studio = await prisma.studio.create({
    data: {
      userId: studioUser.id,
      name: 'Fenomen Dans Ve Sanat Akademi',
      address: 'Çankaya, Ankara',
      city: 'Ankara',
      capacity: 50,
      pricePerHour: 300,
      facilities: ['Ayna', 'Ses sistemi', 'Klima'],
      photos: [],
      description: 'Profesyonel dans stüdyosu',
      isActive: true
    }
  });

  console.log('✅ Stüdyo hesabı oluşturuldu!');
  console.log('━'.repeat(50));
  console.log('Email    :', studioUser.email);
  console.log('Şifre    :', 'test123');
  console.log('Stüdyo   :', studio.name);
  console.log('━'.repeat(50));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
