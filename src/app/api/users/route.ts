// GET /api/users
// Kullanıcı listesi (role ve arama filtreleme ile)

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Auth kontrolü
    const currentUser = getUserFromRequest(request);
    if (!currentUser) {
      return unauthorizedResponse('Giriş yapmanız gerekiyor');
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role'); // DANCER, STUDIO, etc.
    const search = searchParams.get('search'); // İsim veya email araması
    const danceStyle = searchParams.get('danceStyle'); // Dans kategorisi filtresi
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50'); // Default 50, max 100
    const skip = (page - 1) * Math.min(limit, 100);
    const take = Math.min(limit, 100);

    // Filtre oluştur
    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (danceStyle && role === 'DANCER') {
      where.danceStyles = {
        has: danceStyle,
      };
    }

    // Toplam sayıyı al (pagination için)
    const total = await prisma.user.count({ where });

    // Kullanıcıları getir
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        danceStyles: true,
        experience: true,
        studioName: true,
        bio: true,
      },
      orderBy: {
        name: 'asc',
      },
      skip,
      take,
    });

    return successResponse(
      {
        users,
        pagination: {
          page,
          limit: take,
          total,
          totalPages: Math.ceil(total / take),
          hasMore: skip + users.length < total,
        }
      }, 
      `${users.length} kullanıcı bulundu (Toplam: ${total})`
    );
  } catch (error) {
    console.error('Get users error:', error);
    return errorResponse('Kullanıcılar getirilemedi', 500, error);
  }
}
