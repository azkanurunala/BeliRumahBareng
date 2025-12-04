import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

// Setup connection pooling untuk Neon serverless (sama seperti di db.ts)
const pool = new Pool({
  connectionString: process.env.DB_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: ['info', 'warn', 'error'],
});

async function main() {
  console.log('🌱 Starting seed...');

  // Seed User Biasa
  const userEmail = 'user@mail.com';
  const existingUser = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (existingUser) {
    // Update existing user to ensure role is set
    await prisma.user.update({
      where: { email: userEmail },
      data: { role: 1 }, // User biasa
    });
    console.log(`✅ User ${userEmail} already exists, updated role to 1...`);
  } else {
    const user = await prisma.user.create({
      data: {
        name: 'User',
        email: userEmail,
        phoneNumber: '+62 812-3456-7890',
        avatarUrl: '/images/default-avatar.png',
        avatarHint: 'default avatar',
        passwordHash: 'B3L1Rum4H13129', // Plain text password (untuk development)
        role: 1, // User biasa
        locationPreference: 'Surabaya',
        priceRange: '300-600 juta IDR',
        investmentGoals: 'Kepemilikan rumah pertama',
        financialCapacity: '500 juta IDR',
        timeHorizon: 'Jangka panjang (10+ tahun)',
      },
    });
    console.log(`✅ Created user: ${user.email} (ID: ${user.id}, Role: ${user.role})`);
  }

  // Seed Admin User
  const adminEmail = 'admin@mail.com';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    // Update existing admin to ensure role is set
    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: 2 }, // Admin
    });
    console.log(`✅ Admin ${adminEmail} already exists, updated role to 2...`);
  } else {
    const admin = await prisma.user.create({
      data: {
        name: 'Admin',
        email: adminEmail,
        phoneNumber: '+62 812-3456-9999',
        avatarUrl: '/images/default-avatar.png',
        avatarHint: 'default avatar',
        passwordHash: 'B3L1Rum4H13129', // Plain text password (untuk development)
        role: 2, // Admin
        locationPreference: 'Jakarta',
        priceRange: '500-1000 juta IDR',
        investmentGoals: 'Administrasi sistem',
        financialCapacity: '1000 juta IDR',
        timeHorizon: 'Jangka panjang (10+ tahun)',
      },
    });
    console.log(`✅ Created admin: ${admin.email} (ID: ${admin.id}, Role: ${admin.role})`);
  }

  console.log('✨ Seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

