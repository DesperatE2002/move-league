// GET /api/auth/me
// Mevcut kullanıcının güncel bilgilerini döndürür

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const currentUser = getUserFromRequest(request);
    if (!currentUser) {
      return unauthorizedResponse('Giriş yapmanız gerekiyor');
    }

    // Kullanıcının güncel verilerini database'den çek
    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        danceStyles: true,
        experience: true,
        rating: true,
        badges: true,
        studioName: true,
        bio: true,
        location: true,
        createdAt: true
      }
    });

    if (!user) {
      return errorResponse('Kullanıcı bulunamadı', 404);
    }

    return successResponse({
      user: {
        ...user,
        // Frontend için id alanı
        id: user.id
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return errorResponse('Kullanıcı bilgileri alınamadı', 500);
  }
}
