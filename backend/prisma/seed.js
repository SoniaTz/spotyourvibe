import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create Admin User
  const hashedAdminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@spotyourvibe.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@spotyourvibe.com',
      password: hashedAdminPassword,
      role: 'ADMIN',
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create SuperAdmin User
  const hashedSuperAdminPassword = await bcrypt.hash('superadmin123', 10);
  await prisma.user.upsert({
    where: { email: 'info@spotyourvibe.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'info@spotyourvibe.com',
      password: hashedSuperAdminPassword,
      role: 'SUPERADMIN',
    },
  });
  console.log('✅ SuperAdmin user created: info@spotyourvibe.com');

  // Create Verified Organizer
  const hashedOrganizerPassword = await bcrypt.hash('organizer123', 10);
  const organizer = await prisma.user.upsert({
    where: { email: 'organizer@spotyourvibe.com' },
    update: {},
    create: {
      name: 'Event Organizer',
      email: 'organizer@spotyourvibe.com',
      password: hashedOrganizerPassword,
      role: 'ORGANIZER',
    },
  });
  console.log('✅ Organizer user created:', organizer.email);

  // Create Organizer Application (Approved)
  await prisma.organizerApplication.upsert({
    where: { userId: organizer.id },
    update: {},
    create: {
      userId: organizer.id,
      organizationName: 'Premier Events Co.',
      phone: '+1-555-0100',
      description: 'Leading event organizer specializing in concerts and festivals',
      website: 'https://premierevents.com',
      status: 'APPROVED',
    },
  });
  console.log('✅ Organizer application created (APPROVED)');

  // Create Regular User
  const hashedUserPassword = await bcrypt.hash('user123', 10);
  await prisma.user.upsert({
    where: { email: 'user@spotyourvibe.com' },
    update: {},
    create: {
      name: 'John Doe',
      email: 'user@spotyourvibe.com',
      password: hashedUserPassword,
      role: 'USER',
    },
  });
  console.log('✅ Regular user created: user@spotyourvibe.com');

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });