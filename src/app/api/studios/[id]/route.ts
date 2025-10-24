// GET /api/studios/[id]
// Belirli bir stüdyonun detaylarını getir

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api-response';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = getUserFromRequest(request);
    if (!currentUser) {
      return unauthorizedResponse('Giriş yapmanız gerekiyor');
    }

    const studioId = params.id;

    const studio = await prisma.studio.findUnique({
      where: { id: studioId },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
        battleRequests: {
          where: { status: 'CONFIRMED' },
          include: {
            initiator: { select: { id: true, name: true, avatar: true } },
            challenged: { select: { id: true, name: true, avatar: true } },
          },
          orderBy: { scheduledDate: 'desc' },
          take: 10,
        },
      },
    });

    if (!studio) {
      return notFoundResponse('Stüdyo bulunamadı');
    }

    return successResponse(studio);
  } catch (error) {
    console.error('Get studio error:', error);
    return errorResponse('Stüdyo getirilemedi', 500, error);
  }
}

// PATCH /api/studios/[id]
// Stüdyo bilgilerini güncelle

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = getUserFromRequest(request);
    if (!currentUser) {
      return unauthorizedResponse('Giriş yapmanız gerekiyor');
    }

    const studioId = params.id;

    // Stüdyoyu kontrol et
    const studio = await prisma.studio.findUnique({
      where: { id: studioId },
    });

    if (!studio) {
      return notFoundResponse('Stüdyo bulunamadı');
    }

    // Stüdyonun sahibi olduğunu kontrol et
    if (studio.userId !== currentUser.userId && currentUser.role !== 'ADMIN') {
      return errorResponse('Bu stüdyoyu güncelleme yetkiniz yok', 403);
    }

    const body = await request.json();
    const { name, description, address, city, capacity, pricePerHour, amenities } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (capacity !== undefined) updateData.capacity = parseInt(capacity);
    if (pricePerHour !== undefined) updateData.pricePerHour = pricePerHour ? parseFloat(pricePerHour) : null;
    if (amenities !== undefined) updateData.amenities = amenities;

    const updatedStudio = await prisma.studio.update({
      where: { id: studioId },
      data: updateData,
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });

    return successResponse(updatedStudio, 'Stüdyo güncellendi');
  } catch (error) {
    console.error('Update studio error:', error);
    return errorResponse('Stüdyo güncellenemedi', 500, error);
  }
}

// DELETE /api/studios/[id]
// Stüdyoyu sil

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = getUserFromRequest(request);
    if (!currentUser) {
      return unauthorizedResponse('Giriş yapmanız gerekiyor');
    }

    const studioId = params.id;

    // Stüdyoyu kontrol et
    const studio = await prisma.studio.findUnique({
      where: { id: studioId },
    });

    if (!studio) {
      return notFoundResponse('Stüdyo bulunamadı');
    }

    // Stüdyonun sahibi olduğunu kontrol et
    if (studio.userId !== currentUser.userId && currentUser.role !== 'ADMIN') {
      return errorResponse('Bu stüdyoyu silme yetkiniz yok', 403);
    }

    // Aktif battle'ları kontrol et
    const activeBattles = await prisma.battleRequest.count({
      where: {
        selectedStudioId: studioId,
        status: { in: ['STUDIO_PENDING', 'CONFIRMED'] },
      },
    });

    if (activeBattles > 0) {
      return errorResponse('Aktif battle\'ları olan stüdyo silinemez', 400);
    }

    await prisma.studio.delete({
      where: { id: studioId },
    });

    return successResponse({ success: true }, 'Stüdyo silindi');
  } catch (error) {
    console.error('Delete studio error:', error);
    return errorResponse('Stüdyo silinemedi', 500, error);
  }
}
