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
    where: { email: 'superadmin@spotyourvibe.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'superadmin@spotyourvibe.com',
      password: hashedSuperAdminPassword,
      role: 'SUPERADMIN',
    },
  });
  console.log('✅ SuperAdmin user created: superadmin@spotyourvibe.com');

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
  const user = await prisma.user.upsert({
    where: { email: 'user@spotyourvibe.com' },
    update: {},
    create: {
      name: 'John Doe',
      email: 'user@spotyourvibe.com',
      password: hashedUserPassword,
      role: 'USER',
    },
  });
  console.log('✅ Regular user created:', user.email);

  // Create Categories
  const musicCategory = await prisma.category.upsert({
    where: { name: 'Music' },
    update: {},
    create: { name: 'Music' },
  });

  const conferenceCategory = await prisma.category.upsert({
    where: { name: 'Conference' },
    update: {},
    create: { name: 'Conference' },
  });

  const sportsCategory = await prisma.category.upsert({
    where: { name: 'Sports' },
    update: {},
    create: { name: 'Sports' },
  });

  const entertainmentCategory = await prisma.category.upsert({
    where: { name: 'Entertainment' },
    update: {},
    create: { name: 'Entertainment' },
  });

  const artsCategory = await prisma.category.upsert({
    where: { name: 'Arts' },
    update: {},
    create: { name: 'Arts' },
  });

  const foodCategory = await prisma.category.upsert({
    where: { name: 'Food & Drink' },
    update: {},
    create: { name: 'Food & Drink' },
  });

  console.log('✅ Categories created');

  // Create Venues
  const centralPark = await prisma.venue.create({
    data: {
      name: 'Central Park',
      address: 'Central Park West',
      city: 'New York',
      capacity: 5000,
    },
  });

  const sfConventionCenter = await prisma.venue.create({
    data: {
      name: 'SF Convention Center',
      address: '747 Howard St',
      city: 'San Francisco',
      capacity: 3000,
    },
  });

  const comedyClub = await prisma.venue.create({
    data: {
      name: 'Comedy Club',
      address: '8433 Sunset Blvd',
      city: 'Los Angeles',
      capacity: 500,
    },
  });

  const madisonSquare = await prisma.venue.create({
    data: {
      name: 'Madison Square Garden',
      address: '4 Pennsylvania Plaza',
      city: 'New York',
      capacity: 20000,
    },
  });

  console.log('✅ Venues created');

  // Create Events
  const event1 = await prisma.event.create({
    data: {
      title: 'Summer Music Festival 2026',
      shortDescription: 'Three-day festival featuring 50+ artists',
      fullDescription: 'Join us for the biggest music festival of the summer! Experience three days of non-stop music from the world\'s top artists across multiple stages.',
      startDate: new Date('2026-07-20T18:00:00'),
      endDate: new Date('2026-07-22T23:00:00'),
      maxCapacity: 5000,
      availableSeats: 5000,
      status: 'APPROVED',
      organizerId: organizer.id,
      venueId: centralPark.id,
      categoryId: musicCategory.id,
    },
  });

  const event2 = await prisma.event.create({
    data: {
      title: 'Tech Innovation Summit',
      shortDescription: 'Annual technology conference',
      fullDescription: 'Connect with industry leaders and discover the latest innovations in technology. Features keynote speakers, workshops, and networking opportunities.',
      startDate: new Date('2026-08-05T09:00:00'),
      endDate: new Date('2026-08-05T17:00:00'),
      maxCapacity: 3000,
      availableSeats: 3000,
      status: 'APPROVED',
      organizerId: organizer.id,
      venueId: sfConventionCenter.id,
      categoryId: conferenceCategory.id,
    },
  });

  const event3 = await prisma.event.create({
    data: {
      title: 'Stand-Up Comedy Night',
      shortDescription: 'Evening of laughs with top comedians',
      fullDescription: 'Get ready for a night of non-stop laughter! Featuring some of the best stand-up comedians in the business.',
      startDate: new Date('2026-07-28T20:00:00'),
      endDate: new Date('2026-07-28T23:00:00'),
      maxCapacity: 500,
      availableSeats: 500,
      status: 'APPROVED',
      organizerId: organizer.id,
      venueId: comedyClub.id,
      categoryId: entertainmentCategory.id,
    },
  });

  const event4 = await prisma.event.create({
    data: {
      title: 'NBA Finals Game 7',
      shortDescription: 'Championship game',
      fullDescription: 'Witness history in the making! The final game of the NBA championship series.',
      startDate: new Date('2026-06-20T19:30:00'),
      endDate: new Date('2026-06-20T22:30:00'),
      maxCapacity: 20000,
      availableSeats: 20000,
      status: 'APPROVED',
      organizerId: organizer.id,
      venueId: madisonSquare.id,
      categoryId: sportsCategory.id,
    },
  });

  // Create Event with Assigned Seating
  const event5 = await prisma.event.create({
    data: {
      title: 'Broadway Theater Night',
      shortDescription: 'Reserved seating — pick your exact seats',
      fullDescription: 'Enjoy a world-class Broadway performance from your chosen seats. Every seat has a clear view of the stage.',
      seatingType: 'assigned',
      seatRows: 5,
      seatColumns: 10,
      maxTicketsPerOrder: 6,
      startDate: new Date('2026-08-15T19:30:00'),
      endDate: new Date('2026-08-15T22:00:00'),
      maxCapacity: 50,
      availableSeats: 50,
      status: 'APPROVED',
      organizerId: organizer.id,
      venueId: comedyClub.id,
      categoryId: entertainmentCategory.id,
    },
  });

  // Generate seats for the assigned-seating event
  const seatData = [];
  const rowLabels = 'ABCDE';
  for (let r = 0; r < 5; r++) {
    for (let c = 1; c <= 10; c++) {
      seatData.push({
        eventId: event5.id,
        row: rowLabels[r],
        number: c,
        label: `${rowLabels[r]}${c}`,
        status: 'available',
      });
    }
  }
  await prisma.seat.createMany({ data: seatData });
  console.log('✅ Assigned-seating event with 50 seats created');

  console.log('✅ Events created');

  // Create Sample Bookings
  await prisma.booking.create({
    data: {
      userId: user.id,
      eventId: event1.id,
      seatsReserved: 2,
      contactName: 'John Doe',
      contactEmail: 'user@spotyourvibe.com',
      contactPhone: '+1234567890',
    },
  });

  // Update available seats
  await prisma.event.update({
    where: { id: event1.id },
    data: { availableSeats: 4998 },
  });

  console.log('✅ Sample booking created');

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