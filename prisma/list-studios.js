/**
 * Tüm stüdyoları listele
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🏢 Stüdyolar listeleniyor...\n');

  const studios = await prisma.studio.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true
        }
      }
    },
    orderBy: { name: 'asc' }
  });

  console.log(`✅ Toplam ${studios.length} stüdyo bulundu:\n`);

  studios.forEach((studio, index) => {
    console.log(`${index + 1}. ${studio.name}`);
    console.log(`   📍 ${studio.city} - ${studio.address}`);
    console.log(`   👤 Sahip: ${studio.user.name} (${studio.user.email})`);
    console.log(`   👥 Kapasite: ${studio.capacity} kişi`);
    console.log(`   💰 Fiyat: ${studio.pricePerHour} ₺/saat`);
    console.log(`   ${studio.isActive ? '✅ Aktif' : '❌ Pasif'}`);
    console.log('');
  });
}

main()
  .catch((e) => {
    console.error('❌ Hata:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
