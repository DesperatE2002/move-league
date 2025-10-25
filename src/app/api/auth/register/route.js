import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, name, role, danceStyles, studioName } = body;

    // Validation
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { success: false, message: 'Email, password, name, and role are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Bu email adresi zaten kullanılıyor' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user - role'ü uppercase'e çevir
    const userData = {
      email,
      password: hashedPassword,
      name,
      role: role.toUpperCase(), // DANCER, INSTRUCTOR, STUDIO formatına çevir
      danceStyles: danceStyles || [],
      ...(role === 'studio' && studioName && { studioName })
    };

    const user = await prisma.user.create({
      data: userData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        danceStyles: true,
        studioName: true,
        avatar: true,
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      success: true,
      message: 'Kayıt başarılı!',
      data: {
        user,
        token
      }
    });

  } catch (error) {
    console.error('❌ Register error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Kayıt sırasında bir hata oluştu' },
      { status: 500 }
    );
  }
}
