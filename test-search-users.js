const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function searchUsers() {
  try {
    console.log('🔍 Searching for "miray"...\n');
    
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: 'miray', mode: 'insensitive' } },
          { email: { contains: 'miray', mode: 'insensitive' } }
        ]
      }
    });

    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`\n- ID: ${user.id}`);
      console.log(`  Name: ${user.name}`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Role: ${user.role}`);
    });

    console.log('\n\n📊 All users in database:');
    const allUsers = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true }
    });
    console.log(JSON.stringify(allUsers, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

searchUsers();
