// Admin endpoint - Studio role sahip user'lar için Studio kaydı oluştur
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

    if (currentUser.role !== 'ADMIN') {
      return errorResponse('Sadece adminler bu işlemi yapabilir', 403);
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return errorResponse('userId gerekli', 400);
    }

    // User'ı kontrol et
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return errorResponse('Kullanıcı bulunamadı', 404);
    }

    if (user.role !== 'STUDIO') {
      return errorResponse('Kullanıcı STUDIO rolüne sahip değil', 400);
    }

    // Zaten Studio kaydı var mı kontrol et
    const existingStudio = await prisma.studio.findUnique({
      where: { userId },
    });

    if (existingStudio) {
      return successResponse(existingStudio, 'Studio kaydı zaten mevcut');
    }

    // Studio kaydı oluştur
    const studio = await prisma.studio.create({
      data: {
        userId,
        name: user.name || 'Stüdyo',
        address: 'Adres belirtilmedi',
        city: 'Şehir belirtilmedi',
        capacity: 20,
        pricePerHour: 0,
        facilities: [],
        photos: [],
        description: 'Lütfen stüdyo bilgilerinizi güncelleyin',
        isActive: true,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    console.log(`✅ Studio record created for user: ${user.name} (${userId})`);

    return successResponse(studio, 'Studio kaydı oluşturuldu. Lütfen bilgileri güncelleyin.', 201);
  } catch (error) {
    console.error('Create studio record error:', error);
    return errorResponse('Studio kaydı oluşturulamadı', 500, error);
  }
}
