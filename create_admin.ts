import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
    const email = 'hicham@admin.com';
    const passwordHash = await bcrypt.hash('admin123', 12);
    
    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (user) {
      console.log('User already exists, updating role and password to admin');
      user = await prisma.user.update({
        where: { email },
        data: {
          password: passwordHash,
          role: 'ADMIN',
          name: 'Hicham Admin'
        }
      });
    } else {
      console.log('Creating new admin user');
      user = await prisma.user.create({
        data: {
          email,
          password: passwordHash,
          role: 'ADMIN',
          name: 'Hicham Admin'
        }
      });
    }
    
    console.log('Successfully created/updated admin user:', user.email);
  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
