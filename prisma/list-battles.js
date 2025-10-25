/**
 * Tüm battle'ları listele
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('⚔️ Battlelar listeleniyor...\n');

  const battles = await prisma.battleRequest.findMany({
    include: {
      initiator: {
        select: { id: true, name: true, email: true }
      },
      challenged: {
        select: { id: true, name: true, email: true }
      },
      selectedStudio: {
        select: { id: true, name: true }
      },
      referee: {
        select: { id: true, name: true, email: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`✅ Toplam ${battles.length} battle bulundu:\n`);

  battles.forEach((battle, index) => {
    console.log(`${index + 1}. ${battle.title || 'Battle'}`);
    console.log(`   ID: ${battle.id}`);
    console.log(`   Status: ${battle.status}`);
    console.log(`   👤 ${battle.initiator.name} ⚔️ VS ⚔️ ${battle.challenged.name}`);
    
    if (battle.selectedStudio) {
      console.log(`   🏢 Stüdyo: ${battle.selectedStudio.name}`);
    }
    
    if (battle.referee) {
      console.log(`   ⚖️ Hakem: ${battle.referee.name}`);
    } else {
      console.log(`   ⚠️ Hakem atanmadı`);
    }
    
    if (battle.scheduledDate) {
      console.log(`   📅 Tarih: ${new Date(battle.scheduledDate).toLocaleDateString('tr-TR')}`);
    }
    
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
