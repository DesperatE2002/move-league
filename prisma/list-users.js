const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listUsers() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true }
  });
  
  console.log('\n👥 Users:');
  users.forEach(u => {
    console.log(`- ${u.email} (${u.role}) - ID: ${u.id} - Name: ${u.name}`);
  });
  
  await prisma.$disconnect();
}

listUsers();
