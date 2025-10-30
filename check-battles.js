const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBattles() {
  console.log('🔍 Checking battles in database...\n');

  const battles = await prisma.battleRequest.findMany({
    include: {
      initiator: {
        select: {
          name: true,
          email: true
        }
      },
      challenged: {
        select: {
          name: true,
          email: true
        }
      }
    }
  });

  console.log(`📊 Total battles: ${battles.length}\n`);

  battles.forEach((battle, idx) => {
    console.log(`Battle ${idx + 1}:`);
    console.log(`  ID: ${battle.id}`);
    console.log(`  Title: ${battle.title}`);
    console.log(`  Status: ${battle.status}`);
    console.log(`  Initiator: ${battle.initiator.name} (${battle.initiator.email})`);
    console.log(`  Challenged: ${battle.challenged.name} (${battle.challenged.email})`);
    console.log(`  Scheduled Date: ${battle.scheduledDate}`);
    console.log(`  Scheduled Time: ${battle.scheduledTime}`);
    console.log(`  Location: ${battle.location}`);
    console.log(`  Created At: ${battle.createdAt}`);
    console.log('');
  });
}

checkBattles()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
