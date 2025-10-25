const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  // Tahsin Şentürk'ü bul
  const referee = await prisma.user.findUnique({
    where: { email: 'tahsin@moveleague.com' }
  });

  if (!referee) {
    console.log('❌ Hakem bulunamadı');
    return;
  }

  console.log('✅ Hakem bulundu:');
  console.log('Email:', referee.email);
  console.log('İsim:', referee.name);
  console.log('Role:', referee.role);
  
  // Test şifreleri
  const testPasswords = [
    'Hakem2025!',
    'tahsin123',
    'password',
    'Tahsin2025!',
    'referee123'
  ];

  console.log('\n🔐 Şifre testi yapılıyor...');
  for (const pwd of testPasswords) {
    const isValid = await bcrypt.compare(pwd, referee.password);
    if (isValid) {
      console.log(`✅ Doğru şifre: ${pwd}`);
      return;
    }
  }
  
  console.log('❌ Test şifrelerinin hiçbiri eşleşmedi');
  console.log('Yeni şifre belirleyin (varsayılan: Hakem2025!)');
  
  // Yeni şifre hash'le
  const newPassword = 'Hakem2025!';
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  await prisma.user.update({
    where: { id: referee.id },
    data: { password: hashedPassword }
  });
  
  console.log(`✅ Şifre güncellendi: ${newPassword}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
