/**
 * Hakem hesabı oluştur
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('⚖️ Hakem hesabı oluşturuluyor...\n');

  // Hakem bilgileri
  const refereeEmail = 'hakem@moveleague.com';
  const refereePassword = 'Hakem2025!';
  const refereeName = 'Ahmet Yılmaz (Hakem)';

  // Mevcut hakem kontrolü
  const existingReferee = await prisma.user.findUnique({
    where: { email: refereeEmail }
  });

  if (existingReferee) {
    console.log('⚠️  Hakem hesabı zaten mevcut!');
    console.log(`📧 Email: ${existingReferee.email}`);
    console.log(`👤 İsim: ${existingReferee.name}`);
    return;
  }

  // Şifreyi hashle
  const hashedPassword = await bcrypt.hash(refereePassword, 10);

  // Hakem hesabı oluştur
  const referee = await prisma.user.create({
    data: {
      email: refereeEmail,
      password: hashedPassword,
      name: refereeName,
      role: 'REFEREE',
      danceStyles: [],
      bio: 'Battle hakemi - 10 yıllık deneyim'
    }
  });

  console.log('✅ Hakem hesabı başarıyla oluşturuldu!\n');
  console.log('📋 Giriş Bilgileri:');
  console.log('━'.repeat(50));
  console.log(`📧 Email    : ${refereeEmail}`);
  console.log(`🔐 Şifre    : ${refereePassword}`);
  console.log(`👤 İsim     : ${refereeName}`);
  console.log(`⚖️ Rol      : REFEREE`);
  console.log('━'.repeat(50));
  console.log('\n✅ Artık admin panelinden hakem atayabilirsiniz!\n');
}

main()
  .catch((e) => {
    console.error('❌ Hata:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
