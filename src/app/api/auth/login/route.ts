// POST /api/auth/login
// Kullanıcı girişi

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { verifyPassword, generateSessionToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validasyon
    if (!email || !password) {
      return errorResponse('Email ve şifre gerekli', 400);
    }

    // Kullanıcıyı bul
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true,
        avatar: true,
        danceStyles: true,
        studioName: true,
      },
    });

    if (!user) {
      return errorResponse('Kullanıcı bulunamadı', 404);
    }

    // Şifre kontrolü
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return errorResponse('Hatalı şifre', 401);
    }

    // Token oluştur
    const token = generateSessionToken(user.id, user.email, user.role);

    // Şifreyi response'dan çıkar
    const { password: _, ...userWithoutPassword } = user;

    return successResponse({
      user: userWithoutPassword,
      token,
    }, 'Giriş başarılı');
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse('Giriş işlemi başarısız', 500, error);
  }
}
