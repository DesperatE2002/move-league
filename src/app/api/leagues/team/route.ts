// Takım Ligi API
// GET: Aktif sezon takım sıralamasını getir

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // Aktif sezonu bul
    const activeSeason = await prisma.teamLeagueSeason.findFirst({
      where: { status: 'ACTIVE' },
      orderBy: { startDate: 'desc' }
    });

    if (!activeSeason) {
      return NextResponse.json({
        success: true,
        season: null,
        teams: []
      });
    }

    // Takımları ve sıralamayı getir
    const teams = await prisma.team.findMany({
      where: { 
        seasonId: activeSeason.id,
        isActive: true
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
                danceStyles: true
              }
            }
          }
        },
        _count: {
          select: {
            homeMatches: true,
            awayMatches: true
          }
        }
      },
      orderBy: { rank: 'asc' }
    });

    // Son maçları getir
    const recentMatches = await prisma.teamMatch.findMany({
      where: { 
        seasonId: activeSeason.id,
        status: 'completed'
      },
      include: {
        homeTeam: {
          select: { id: true, name: true, logo: true }
        },
        awayTeam: {
          select: { id: true, name: true, logo: true }
        }
      },
      orderBy: { scheduledDate: 'desc' },
      take: 10
    });

    // Yaklaşan maçları getir
    const upcomingMatches = await prisma.teamMatch.findMany({
      where: { 
        seasonId: activeSeason.id,
        status: 'scheduled'
      },
      include: {
        homeTeam: {
          select: { id: true, name: true, logo: true }
        },
        awayTeam: {
          select: { id: true, name: true, logo: true }
        }
      },
      orderBy: { scheduledDate: 'asc' },
      take: 10
    });

    return NextResponse.json({
      success: true,
      season: {
        id: activeSeason.id,
        name: activeSeason.name,
        description: activeSeason.description,
        startDate: activeSeason.startDate,
        endDate: activeSeason.endDate,
        minTeamMembers: activeSeason.minTeamMembers,
        maxTeamMembers: activeSeason.maxTeamMembers,
        prizeFirst: activeSeason.prizeFirst,
        prizeSecond: activeSeason.prizeSecond,
        prizeThird: activeSeason.prizeThird
      },
      teams,
      recentMatches,
      upcomingMatches
    });

  } catch (error: any) {
    console.error('Team league error:', error);
    return NextResponse.json(
      { success: false, error: 'Lig verileri alınırken hata oluştu' },
      { status: 500 }
    );
  }
}
