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
    });

    return successResponse(users, `${users.length} kullanıcı bulundu`);
  } catch (error) {
    console.error('Get users error:', error);
    return errorResponse('Kullanıcılar getirilemedi', 500, error);
  }
}
