// Battle Ligi API
// GET: Aktif sezon sıralamasını getir

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // Aktif sezonu bul
    const activeSeason = await prisma.battleLeagueSeason.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { startDate: 'desc' }
    });

    if (!activeSeason) {
      return NextResponse.json({
        success: true,
        season: null,
        rankings: []
      });
    }

    // Sıralamayı getir
    const rankings = await prisma.battleLeagueRanking.findMany({
      where: { seasonId: activeSeason.id },
      orderBy: { rank: 'asc' },
      take: 100 // Top 100
    });

    return NextResponse.json({
      success: true,
      season: {
        id: activeSeason.id,
        name: activeSeason.name,
        description: activeSeason.description,
        startDate: activeSeason.startDate,
        endDate: activeSeason.endDate,
        prizeFirst: activeSeason.prizeFirst,
        prizeSecond: activeSeason.prizeSecond,
        prizeThird: activeSeason.prizeThird
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
