const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearDatabase() {
  console.log('🗑️  Clearing all data from database...\n');

  try {
    // Sırayla tüm tabloları temizle (foreign key ilişkileri nedeniyle sıralama önemli)
    
    console.log('Deleting notifications...');
    await prisma.notification.deleteMany({});
    
    console.log('Deleting workshop enrollments...');
    await prisma.workshopEnrollment.deleteMany({});
    
    console.log('Deleting workshops...');
    await prisma.workshop.deleteMany({});
    
    console.log('Deleting studio preferences...');
    await prisma.studioPreference.deleteMany({});
    
    console.log('Deleting battle requests...');
    await prisma.battleRequest.deleteMany({});
    
    console.log('Deleting studios...');
    await prisma.studio.deleteMany({});
    
    console.log('Deleting competition invitations...');
    await prisma.competitionInvitation.deleteMany({});
    
    console.log('Deleting competition team members...');
    await prisma.competitionTeamMember.deleteMany({});
    
    console.log('Deleting competition teams...');
    await prisma.competitionTeam.deleteMany({});
    
    console.log('Deleting competitions...');
    await prisma.competition.deleteMany({});
    
    console.log('Deleting team members...');
    await prisma.teamMember.deleteMany({});
    
    console.log('Deleting team matches...');
    await prisma.teamMatch.deleteMany({});
    
    console.log('Deleting teams...');
    await prisma.team.deleteMany({});
    
    console.log('Deleting users...');
    await prisma.user.deleteMany({});

    console.log('\n✅ Database cleared successfully!\n');
    console.log('📊 All tables are now empty and ready for fresh data.');
    
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase();
