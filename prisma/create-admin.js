/**
 * Admin hesabı oluştur
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('👑 Admin hesabı oluşturuluyor...\n');

  // Admin bilgileri
  const adminEmail = 'admin@mleague.com';
  const adminPassword = 'MoveLeague2025!';
  const adminName = 'Move League Admin';

  // Mevcut admin kontrolü
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (existingAdmin) {
    console.log('⚠️  Admin hesabı zaten mevcut!');
    console.log(`📧 Email: ${existingAdmin.email}`);
    console.log(`👤 İsim: ${existingAdmin.name}`);
    return;
  }

  // Şifreyi hashle
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  // Admin hesabı oluştur
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      password: hashedPassword,
      name: adminName,
      role: 'ADMIN',
      danceStyles: [],
      badges: ['admin', 'founder'],
      bio: 'Move League Platform Yöneticisi'
    }
  });

  console.log('✅ Admin hesabı başarıyla oluşturuldu!\n');
  console.log('📋 Giriş Bilgileri:');
  console.log('━'.repeat(50));
  console.log(`📧 Email    : ${adminEmail}`);
  console.log(`🔐 Şifre    : ${adminPassword}`);
  console.log(`👤 İsim     : ${adminName}`);
  console.log(`🎭 Rol      : ADMIN`);
  console.log('━'.repeat(50));
  console.log('\n⚠️  ÖNEMLİ: Bu bilgileri güvenli bir yerde saklayın!\n');
}

main()
  .catch((e) => {
    console.error('❌ Hata:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
