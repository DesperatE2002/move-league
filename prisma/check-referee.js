const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('\n🔍 Hakem Bilgileri\n');

    // Tahsin Şentürk'ü bul
    const referee = await prisma.user.findFirst({
      where: {
        name: 'Tahsin Şentürk'
      }
    });

    if (referee) {
      console.log('✅ Hakem bulundu:');
      console.log(`   ID: ${referee.id}`);
      console.log(`   İsim: ${referee.name}`);
      console.log(`   Email: ${referee.email}`);
      console.log(`   Role: ${referee.role}\n`);

      // Bu hakeme atanan battle'ları bul
      const battles = await prisma.battleRequest.findMany({
        where: {
          refereeId: referee.id
        },
        include: {
          initiator: { select: { name: true } },
          challenged: { select: { name: true } }
        }
      });

      console.log(`📋 Atandığı Battle'lar: ${battles.length}\n`);
      battles.forEach((b, idx) => {
        console.log(`${idx + 1}. ${b.initiator.name} vs ${b.challenged.name}`);
        console.log(`   Battle ID: ${b.id}`);
        console.log(`   Referee ID: ${b.refereeId}`);
        console.log(`   Status: ${b.status}\n`);
      });
    } else {
      console.log('❌ Hakem bulunamadı!');
    }

  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
