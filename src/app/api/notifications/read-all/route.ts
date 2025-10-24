// POST /api/notifications/read-all
// Tüm bildirimleri okundu olarak işaretle

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const currentUser = getUserFromRequest(request);
    if (!currentUser) {
      return unauthorizedResponse('Giriş yapmanız gerekiyor');
    }

    await prisma.notification.updateMany({
      where: {
        userId: currentUser.userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return successResponse({ success: true }, 'Tüm bildirimler okundu olarak işaretlendi');
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    return errorResponse('Bildirimler güncellenemedi', 500, error);
  }
}
