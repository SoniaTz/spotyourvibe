import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clean up old conflicting records that may have been created by previous seeds
  // The contact email is now dynamically fetched from the superadmin's profile,
  // so we only need to ensure there's one superadmin with their real email.
  const superAdmin = await prisma.user.findFirst({
    where: { role: 'SUPERADMIN' },
  });

  if (superAdmin) {
    // Delete any other user records with conflicting emails (info@, hey@ etc.)
    // that are NOT the superadmin
    const staleEmails = ['info@spotyourvibe.com', 'hey@spotyourvibe.com'];
    for (const email of staleEmails) {
      if (email !== superAdmin.email) {
        const staleUser = await prisma.user.findUnique({ where: { email } });
        if (staleUser) {
          await prisma.user.delete({ where: { id: staleUser.id } });
          console.log(`✅ Removed stale user record: ${email}`);
        }
      }
    }
  }

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

  // Create SuperAdmin user only if one doesn't exist already
  const hashedSuperAdminPassword = await bcrypt.hash('superadmin123', 10);
  const existingSuperAdmin = await prisma.user.findFirst({
    where: { role: 'SUPERADMIN' },
  });
  
  if (!existingSuperAdmin) {
    await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: 'info@spotyourvibe.com',
        password: hashedSuperAdminPassword,
        role: 'SUPERADMIN',
      },
    });
    console.log('✅ SuperAdmin user created: info@spotyourvibe.com');
  } else {
    // Don't override the email - keep whatever the user set in their profile
    console.log('✅ SuperAdmin already exists, keeping their profile email:', existingSuperAdmin.email);
  }

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

  // Create Categories
  const categories = ['Music', 'Conference', 'Sports', 'Entertainment', 'Arts', 'Food & Drink'];
  const categoryRecords = {};
  for (const name of categories) {
    const cat = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name }
    });
    categoryRecords[name] = cat;
  }
  console.log('✅ Categories created');

  // Create Venues
  const venueData = [
    { name: 'Madison Square Garden', address: '4 Pennsylvania Plaza', city: 'New York', capacity: 20789 },
    { name: 'The O2 Arena', address: 'Peninsula Square', city: 'London', capacity: 20000 },
    { name: 'Staples Center', address: '1111 S Figueroa St', city: 'Los Angeles', capacity: 19060 },
    { name: 'Sydney Opera House', address: 'Bennelong Point', city: 'Sydney', capacity: 5738 },
    { name: 'Berlin Philharmonic', address: 'Herbert-von-Karajan-Straße 1', city: 'Berlin', capacity: 2440 },
  ];
  const venueRecords = [];
  for (const v of venueData) {
    const venue = await prisma.venue.upsert({
      where: { id: v.name.toLowerCase().replace(/\s+/g, '-') },
      update: {},
      create: { id: v.name.toLowerCase().replace(/\s+/g, '-'), ...v }
    });
    venueRecords.push(venue);
  }
  console.log('✅ Venues created');

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