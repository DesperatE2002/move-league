// Battle Ligi API
// GET: Aktif sezon sıralamasını getir

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // Aktif sezonu bul (opsiyonel - şimdilik kullanmayacağız)
    const activeSeason = await prisma.battleLeagueSeason.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { startDate: 'desc' }
    });

    // Tüm dansçıları rating'lerine göre sıralı getir
    const dancers = await prisma.user.findMany({
      where: { role: 'DANCER' },
      orderBy: { rating: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        rating: true,
        danceStyles: true,
        createdAt: true,
        // Battle istatistikleri için relation'lar
        initiatedBattles: {
          where: { status: 'COMPLETED' },
          select: {
            id: true,
            winnerId: true,
            scores: true,
          }
        },
        challengedBattles: {
          where: { status: 'COMPLETED' },
          select: {
            id: true,
            winnerId: true,
            scores: true,
          }
        }
      }
    });

    // Her dansçı için istatistikleri hesapla
    const rankings = dancers.map((dancer, index) => {
      // Tüm battle'ları birleştir
      const allBattles = [
        ...dancer.initiatedBattles,
        ...dancer.challengedBattles
      ];

      const totalBattles = allBattles.length;
      const wins = allBattles.filter(b => b.winnerId === dancer.id).length;
      const losses = allBattles.filter(b => b.winnerId && b.winnerId !== dancer.id).length;
      const draws = allBattles.filter(b => !b.winnerId).length;
      const winRate = totalBattles > 0 ? (wins / totalBattles) * 100 : 0;

      return {
        id: dancer.id,
        rank: index + 1,
        dancerName: dancer.name,
        dancerAvatar: dancer.avatar,
        danceStyle: dancer.danceStyles && dancer.danceStyles.length > 0 
          ? dancer.danceStyles[0] 
          : 'Genel',
        rating: dancer.rating || 1200,
        totalBattles,
        wins,
        losses,
        draws,
        winRate: Math.round(winRate * 10) / 10, // 1 ondalık basamak
      };
    });

    return NextResponse.json({
      success: true,
      season: activeSeason ? {
        id: activeSeason.id,
        name: activeSeason.name,
        description: activeSeason.description,
        startDate: activeSeason.startDate,
        endDate: activeSeason.endDate,
        prizeFirst: activeSeason.prizeFirst,
        prizeSecond: activeSeason.prizeSecond,
        prizeThird: activeSeason.prizeThird
      } : {
        id: 'current',
        name: 'Genel Sıralama',
        description: 'Tüm dansçıların ELO puanlarına göre sıralaması',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-12-31'),
        prizeFirst: null,
        prizeSecond: null,
        prizeThird: null
      },
      rankings
    });

  } catch (error: any) {
    console.error('Battle league error:', error);
    return NextResponse.json(
      { success: false, error: 'Lig verileri alınırken hata oluştu' },
      { status: 500 }
    );
  }
}
