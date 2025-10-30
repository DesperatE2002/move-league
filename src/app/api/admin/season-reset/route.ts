import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { verifyToken } from '@/lib/auth';

// Sezon sıfırla: Tam (1200) veya %20 Taşıma (1200 + rating*0.2)
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
    const { mode, seasonName } = body; // mode: 'full' | 'carry20'

    if (!mode || !['full', 'carry20'].includes(mode)) {
      return errorResponse('mode: full veya carry20 olmalı', 400);
    }

    // Tüm dansçıları getir
    const dancers = await prisma.user.findMany({
      where: { role: 'DANCER' },
      select: { id: true, name: true, rating: true },
    });

    // Yeni rating hesapla
    const updates = dancers.map(dancer => {
      const currentRating = dancer.rating || 1200;
      let newRating;

      if (mode === 'full') {
        newRating = 1200;
      } else {
        // carry20: 1200 + (rating * 0.20)
        const bonus = Math.round(currentRating * 0.20);
        newRating = 1200 + bonus;
      }

      return {
        id: dancer.id,
        oldRating: currentRating,
        newRating,
      };
    });

    // Batch update
    await Promise.all(
      updates.map(({ id, newRating }) =>
        prisma.user.update({
          where: { id },
          data: { rating: newRating },
        })
      )
    );

    // Sezon kaydı oluştur (opsiyonel - season tablosu varsa)
    // const season = await prisma.season.create({
    //   data: {
    //     name: seasonName || `Sezon ${new Date().getFullYear()}`,
    //     startDate: new Date(),
    //     endDate: null,
    //     type: 'BATTLE',
    //   },
    // });

    return successResponse({
      message: mode === 'full' 
        ? 'Tüm dansçılar 1200 puana sıfırlandı' 
        : 'Dansçılar 1200 + %20 puana sıfırlandı',
      updates,
      totalUsers: dancers.length,
      seasonName: seasonName || 'Yeni Sezon',
    });
  } catch (error) {
    console.error('Season reset error:', error);
    return errorResponse('Sezon sıfırlama başarısız', 500);
  }
}
