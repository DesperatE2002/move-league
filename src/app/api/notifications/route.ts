// GET /api/notifications
// Kullanıcının bildirimlerini getir

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

    const { searchParams } = new URL(request.url);
    const isRead = searchParams.get('isRead');
    const type = searchParams.get('type');

    const where: any = { userId: currentUser.userId };

    if (isRead !== null) {
      where.isRead = isRead === 'true';
    }

    if (type) {
      where.type = type;
    }

    const notifications = await prisma.notification.findMany({
      where,
      include: {
        battleRequest: {
          include: {
            initiator: { select: { id: true, name: true, avatar: true, danceStyles: true } },
            challenged: { select: { id: true, name: true, avatar: true, danceStyles: true } },
          },
        },
        studio: {
          select: { id: true, name: true, city: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Okunmamış bildirimlerin sayısını da gönder
    const unreadCount = await prisma.notification.count({
      where: {
        userId: currentUser.userId,
        isRead: false,
      },
    });

    return successResponse({
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return errorResponse('Bildirimler getirilemedi', 500, error);
  }
}
