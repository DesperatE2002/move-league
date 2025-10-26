const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMiray() {
  try {
    console.log('🔍 Miray\'ın verilerini kontrol ediliyor...\n');

    // Miray'ı bul
    const miray = await prisma.user.findFirst({
      where: {
        email: 'miray@mleague.com'
      },
      include: {
        initiatedBattles: {
          select: {
            id: true,
            status: true,
            winnerId: true,
            scores: true,
            createdAt: true
          }
        },
        challengedBattles: {
          select: {
            id: true,
            status: true,
            winnerId: true,
            scores: true,
            createdAt: true
          }
        },
        wonBattles: {
          select: {
            id: true,
            status: true,
            createdAt: true
          }
        }
      }
    });

    if (!miray) {
      console.log('❌ Miray bulunamadı!');
      return;
    }

    console.log('✅ Miray bulundu:');
    console.log(`   📧 Email: ${miray.email}`);
    console.log(`   👤 İsim: ${miray.name}`);
    console.log(`   ⭐ Rating: ${miray.rating}`);
    console.log(`   🎯 Rol: ${miray.role}`);
    console.log('');

    console.log('📊 Battle İstatistikleri:');
    console.log(`   Başlattığı battle'lar: ${miray.initiatedBattles.length}`);
    console.log(`   Davet edildiği battle'lar: ${miray.challengedBattles.length}`);
    console.log(`   Kazandığı battle'lar: ${miray.wonBattles.length}`);
    console.log('');

    const allBattles = [...miray.initiatedBattles, ...miray.challengedBattles];
    const completedBattles = allBattles.filter(b => b.status === 'COMPLETED');
    
    console.log('🏁 Tamamlanan Battle\'lar:');
    if (completedBattles.length === 0) {
      console.log('   ⚠️ Hiç tamamlanmış battle yok!');
    } else {
      completedBattles.forEach((battle, idx) => {
        console.log(`   ${idx + 1}. Battle ID: ${battle.id}`);
        console.log(`      Status: ${battle.status}`);
        console.log(`      Winner ID: ${battle.winnerId}`);
        console.log(`      Miray kazandı mı? ${battle.winnerId === miray.id ? '✅ EVET' : '❌ HAYIR'}`);
        console.log(`      Scores: ${battle.scores ? 'VAR' : 'YOK'}`);
        if (battle.scores) {
          console.log(`      Score detay: ${JSON.stringify(battle.scores)}`);
        }
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMiray();
