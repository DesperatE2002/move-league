// POST /api/notifications/[id]/read
// Bildirimi okundu olarak işaretle

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api-response';
import { getUserFromRequest } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = getUserFromRequest(request);
    if (!currentUser) {
      return unauthorizedResponse('Giriş yapmanız gerekiyor');
    }

    const notificationId = params.id;

    // Bildirimi kontrol et
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return notFoundResponse('Bildirim bulunamadı');
    }

    // Bildirimin kullanıcıya ait olduğunu kontrol et
    if (notification.userId !== currentUser.userId) {
      return errorResponse('Bu bildirimi işaretleme yetkiniz yok', 403);
    }

    // Bildirimi okundu olarak işaretle
    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    return successResponse(updatedNotification, 'Bildirim okundu olarak işaretlendi');
  } catch (error) {
    console.error('Mark notification read error:', error);
    return errorResponse('Bildirim güncellenemedi', 500, error);
  }
}
