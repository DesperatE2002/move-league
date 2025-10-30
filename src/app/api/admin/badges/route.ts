import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { verifyToken } from '@/lib/auth';

// Kullanıcıya rozet ekle/çıkar
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse('Unauthorized', 401);
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return errorResponse('Invalid token', 401);
    }

    // Admin kontrolü
    const admin = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (admin?.role !== 'ADMIN') {
      return errorResponse('Admin yetkisi gerekli', 403);
    }

    const body = await request.json();
    const { userId, badge, action } = body; // action: 'add' | 'remove'

    if (!userId || !badge || !action) {
      return errorResponse('userId, badge ve action gerekli', 400);
    }

    // Kullanıcıyı bul
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return errorResponse('Kullanıcı bulunamadı', 404);
    }

    // Mevcut rozet listesi
    const currentBadges = user.badges || [];

    let updatedBadges;
    if (action === 'add') {
      // Rozet zaten varsa ekleme
      if (currentBadges.includes(badge)) {
        return errorResponse('Rozet zaten mevcut', 400);
      }
      updatedBadges = [...currentBadges, badge];
    } else if (action === 'remove') {
      updatedBadges = currentBadges.filter(b => b !== badge);
    } else {
      return errorResponse('Geçersiz action: add veya remove olmalı', 400);
    }

    // Güncelle
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { badges: updatedBadges },
      select: {
        id: true,
        name: true,
        email: true,
        badges: true,
      },
    });

    return successResponse({
      user: updatedUser,
      message: action === 'add' ? 'Rozet eklendi' : 'Rozet kaldırıldı',
    });
  } catch (error) {
    console.error('Badge management error:', error);
    return errorResponse('Rozet işlemi başarısız', 500);
  }
}
