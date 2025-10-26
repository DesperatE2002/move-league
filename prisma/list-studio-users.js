const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  const studios = await prisma.studio.findMany({
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true
        }
      }
    }
  });

  console.log('\n🏢 Stüdyo Kullanıcıları:\n');
  studios.forEach((studio, idx) => {
    console.log(`${idx + 1}. ${studio.name}`);
    console.log(`   Email: ${studio.user.email}`);
    console.log(`   İsim: ${studio.user.name}`);
    console.log(`   Şifre: test123 (eğer create-test-users ile oluşturulduysa)`);
    console.log('');
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
