// Script to check STUDIO role users without Studio records
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStudioUsers() {
  try {
    console.log('🔍 Checking STUDIO role users...\n');
    
    // Find all STUDIO role users
    const studioUsers = await prisma.user.findMany({
      where: { role: 'STUDIO' },
      select: {
        id: true,
        name: true,
        email: true,
        studioName: true,
        createdAt: true,
      },
    });
    
    console.log(`📊 Found ${studioUsers.length} STUDIO role users\n`);
    
    // Check which ones have Studio records
    for (const user of studioUsers) {
      const studioRecord = await prisma.studio.findUnique({
        where: { userId: user.id },
      });
      
      const hasRecord = studioRecord ? '✅ Has record' : '❌ NO RECORD';
      console.log(`${hasRecord} - ${user.name} (${user.email})`);
      
      if (!studioRecord) {
        console.log(`  ⚠️  User ID: ${user.id}`);
        console.log(`  📅 Created: ${user.createdAt}`);
      }
    }
    
    // Count missing records
    const usersWithoutRecords = [];
    for (const user of studioUsers) {
      const studioRecord = await prisma.studio.findUnique({
        where: { userId: user.id },
      });
      if (!studioRecord) {
        usersWithoutRecords.push(user);
      }
    }
    
    console.log(`\n📈 Summary:`);
    console.log(`   Total STUDIO users: ${studioUsers.length}`);
    console.log(`   Missing records: ${usersWithoutRecords.length}`);
    console.log(`\n💡 These users will get auto-created Studio records on next login!`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStudioUsers();
