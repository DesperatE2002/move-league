// Battle API Routes
// GET: Battle listesi
// POST: Yeni battle talebi oluştur

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/battles - Battle listesi (kullanıcıya göre)
export async function GET(request: NextRequest) {
  try {
    const currentUser = getUserFromRequest(request);
    if (!currentUser) {
      return unauthorizedResponse('Giriş yapmanız gerekiyor');
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // PENDING, CONFIRMED, etc.
    const userId = searchParams.get('userId') || currentUser.userId;

    let where: any;

    // Admin ise TÜM battle'ları göster
    if (currentUser.role === 'ADMIN') {
      where = {};
      if (status) {
        where.status = status;
      }
    }
    // Stüdyo ise, kendi stüdyosuna ait battle'ları göster
    else if (currentUser.role === 'STUDIO') {
      // Stüdyo kaydını bul
      const studio = await prisma.studio.findUnique({
        where: { userId: currentUser.userId },
      });

      if (!studio) {
        return errorResponse('Stüdyo kaydı bulunamadı', 404);
      }

      where = {
        selectedStudioId: studio.id,
      };
    } else {
      // Dansçı/diğerleri için: Kullanıcının dahil olduğu battle'lar
      where = {
        OR: [
          { initiatorId: userId },
          { challengedId: userId },
        ],
      };
    }

    if (status) {
      where.status = status;
    }

    const battles = await prisma.battleRequest.findMany({
      where,
      include: {
        initiator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            danceStyles: true,
            bio: true,
          },
        },
        challenged: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            danceStyles: true,
            bio: true,
          },
        },
        selectedStudio: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
          },
        },
        referee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return successResponse(battles, `${battles.length} battle bulundu`);
  } catch (error) {
    console.error('Get battles error:', error);
    return errorResponse('Battle listesi getirilemedi', 500, error);
  }
}

// POST /api/battles - Yeni battle talebi oluştur
export async function POST(request: NextRequest) {
  try {
    const currentUser = getUserFromRequest(request);
    if (!currentUser) {
      return unauthorizedResponse('Giriş yapmanız gerekiyor');
    }

    // Sadece dansçılar battle oluşturabilir
    if (currentUser.role !== 'DANCER') {
      return errorResponse('Sadece dansçılar battle talebi oluşturabilir', 403);
    }

    const body = await request.json();
    const { challengedId, danceStyle, description } = body;

    // Validasyon
    if (!challengedId) {
      return errorResponse('Rakip seçmeniz gerekiyor', 400);
    }

    if (challengedId === currentUser.userId) {
      return errorResponse('Kendinize battle talebi gönderemezsiniz', 400);
    }

    // Rakibi kontrol et
    const challenged = await prisma.user.findUnique({
      where: { id: challengedId },
    });

    if (!challenged || challenged.role !== 'DANCER') {
      return errorResponse('Geçersiz rakip', 404);
    }

    // Initiator bilgilerini al
    const initiator = await prisma.user.findUnique({
      where: { id: currentUser.userId },
    });

    // Battle talebi oluştur
    const battle = await prisma.battleRequest.create({
      data: {
        initiatorId: currentUser.userId,
        challengedId,
        title: `${initiator?.name || currentUser.email} vs ${challenged.name}`,
        category: danceStyle || 'Hip-Hop',
        description: description || '',
        status: 'PENDING',
      },
      include: {
        initiator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        challenged: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    // Bildirim oluştur
    await prisma.notification.create({
      data: {
        userId: challengedId,
        type: 'BATTLE_REQUEST',
        title: '⚔️ Yeni Battle Talebi!',
        message: `${initiator?.name} sana bir battle talebi gönderdi! Dans stili: ${danceStyle || 'Hip-Hop'}`,
        battleRequestId: battle.id,
        isRead: false,
      },
    });

    console.log(`✅ Battle created: ${battle.id}, Notification sent to: ${challenged.name} (${challengedId}), From: ${initiator?.name}`);

    return successResponse(battle, 'Battle talebi gönderildi', 201);
  } catch (error) {
    console.error('Create battle error:', error);
    return errorResponse('Battle talebi oluşturulamadı', 500, error);
  }
}
