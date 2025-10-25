/**
 * Mevcut STUDIO rolündeki kullanıcılar için otomatik Studio profili oluştur
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🏢 STUDIO kullanıcıları kontrol ediliyor...\n');

  // STUDIO rolündeki tüm kullanıcıları bul
  const studioUsers = await prisma.user.findMany({
    where: {
      role: 'STUDIO'
    },
    include: {
      studio: true // Tekil: User has one Studio
    }
  });

  console.log(`✅ Toplam ${studioUsers.length} STUDIO kullanıcısı bulundu\n`);

  let created = 0;
  let alreadyExists = 0;

  for (const user of studioUsers) {
    // Eğer zaten Studio profili varsa atla
    if (user.studio) {
      console.log(`⏭️  ${user.name} - Zaten studio profili var`);
      alreadyExists++;
      continue;
    }

    // Otomatik Studio profili oluştur
    const studio = await prisma.studio.create({
      data: {
        userId: user.id,
        name: user.studioName || `${user.name} Studio`,
        description: 'Stüdyo açıklaması düzenlenecek',
        address: 'Adres bilgisi eklenecek',
        city: 'Adana',
        capacity: 20,
        facilities: [],
        pricePerHour: 0,
        isActive: true,
      }
    });

    console.log(`✅ ${user.name} - Studio profili oluşturuldu (${studio.name})`);
    created++;
  }

  console.log('\n📊 Sonuç:');
  console.log(`✅ Yeni oluşturulan: ${created}`);
  console.log(`⏭️  Zaten mevcut: ${alreadyExists}`);
  console.log(`📦 Toplam: ${studioUsers.length}`);
}

main()
  .catch((e) => {
    console.error('❌ Hata:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
