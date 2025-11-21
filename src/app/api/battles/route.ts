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
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * Math.min(limit, 100);
    const take = Math.min(limit, 100);

    let where: any;

    // Admin ise TÜM battle'ları göster
    if (currentUser.role === 'ADMIN') {
      where = {};
      if (status) {
        where.status = status;
      }
    }
    // Hakem ise, hakem olarak atandığı battle'ları göster
    else if (currentUser.role === 'REFEREE') {
      where = {
        refereeId: currentUser.userId,
      };
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
        // Stüdyo kaydı yoksa boş liste döndür ve uyar
        console.warn(`⚠️ STUDIO role user ${currentUser.userId} has no Studio record!`);
        return successResponse(
          {
            battles: [],
            pagination: {
              page: 1,
              limit: take,
              total: 0,
              totalPages: 0,
              hasMore: false,
            }
          },
          'Stüdyo kaydınız bulunamadı. Lütfen stüdyo bilgilerinizi tamamlayın.'
        );
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

    // ✅ Performance optimization: includeDetails parametresi
    const includeDetails = searchParams.get('includeDetails') === 'true';

    // Toplam sayı
    const total = await prisma.battleRequest.count({ where });

    const battles = await prisma.battleRequest.findMany({
      where,
      include: includeDetails ? {
        // 🔍 Detaylı include (battle detail sayfası için)
        initiator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            rating: true,
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
            rating: true,
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
            capacity: true,
            pricePerHour: true,
          },
        },
        referee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        studioPreferences: {
          include: {
            studio: {
              select: {
                id: true,
                name: true,
                address: true,
                city: true,
              },
            },
          },
          orderBy: {
            priority: 'asc',
          },
        },
      } : {
        // 📋 Basit include (liste görünümü için)
        initiator: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        challenged: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        selectedStudio: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take,
    });

    return successResponse(
      {
        battles,
        pagination: {
          page,
          limit: take,
          total,
          totalPages: Math.ceil(total / take),
          hasMore: skip + battles.length < total,
        }
      },
      `${battles.length} battle bulundu (Toplam: ${total})`
    );
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

    console.log('🎯 Battle talebi alındı:', {
      initiatorId: currentUser.userId,
      challengedId,
      danceStyle,
      description: description?.substring(0, 50) || '(yok)'
    });

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
        category: danceStyle || 'HİPHOP', // ✅ Fallback değer tutarlı
        description: description || '',
        status: 'PENDING',
        initiatorNoShow: false,
        challengedNoShow: false,
        reminder24hSent: false,
        reminder1hSent: false,
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
        message: `${initiator?.name} sana bir battle talebi gönderdi! Dans stili: ${danceStyle || 'HİPHOP'}`,
        battleRequestId: battle.id,
        isRead: false,
      },
    });

    console.log(`✅ Battle created: ${battle.id}, Category: ${battle.category}, Notification sent to: ${challenged.name} (${challengedId}), From: ${initiator?.name}`);

    return successResponse(battle, 'Battle talebi gönderildi', 201);
  } catch (error) {
    console.error('Create battle error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
    return errorResponse('Battle talebi oluşturulamadı: ' + errorMessage, 500);
  }
}
