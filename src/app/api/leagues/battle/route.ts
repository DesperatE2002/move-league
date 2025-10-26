// Battle Ligi API
// GET: ELO puanına göre sıralamayı getir

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // Tüm dansçıları ELO puanına göre sırala
    const dancers = await prisma.user.findMany({
      where: { 
        role: 'DANCER'
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        rating: true,
        danceStyles: true,
        experience: true,
        wonBattles: {
          select: {
            id: true
          }
        },
        _count: {
          select: {
            initiatedBattles: true,
            challengedBattles: true
          }
        }
      },
      orderBy: {
        rating: 'desc'
      },
      take: 100 // Top 100
    });

    // Sıralamayı formatla
    const rankings = dancers.map((dancer, index) => ({
      rank: index + 1,
      userId: dancer.id,
      name: dancer.name,
      email: dancer.email,
      avatar: dancer.avatar,
      rating: dancer.rating || 1200,
      danceStyles: dancer.danceStyles,
      experience: dancer.experience,
      wins: dancer.wonBattles.length,
      totalBattles: dancer._count.initiatedBattles + dancer._count.challengedBattles
    }));

    return NextResponse.json({
      success: true,
      season: {
        name: 'Move League 2025',
        description: 'ELO puanına göre genel sıralama'
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
