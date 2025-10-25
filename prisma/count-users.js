const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('\n📊 Kullanıcı İstatistikleri\n');

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        rating: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Toplam Kullanıcı: ${users.length}\n`);

    // Rol bazında sayım
    const roleStats = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});

    console.log('Rol Bazında:');
    Object.entries(roleStats).forEach(([role, count]) => {
      console.log(`  ${role}: ${count}`);
    });

    console.log('\n📋 Kullanıcı Listesi:\n');
    users.forEach((user, idx) => {
      console.log(`${idx + 1}. ${user.name} (${user.email})`);
      console.log(`   Role: ${user.role} | Rating: ${user.rating || 'N/A'}`);
      console.log(`   Kayıt: ${user.createdAt.toLocaleDateString('tr-TR')}\n`);
    });

  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
