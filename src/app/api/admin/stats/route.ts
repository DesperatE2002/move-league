// GET /api/admin/stats
// Admin dashboard istatistikleri

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const currentUser = getUserFromRequest(request);
    
    if (!currentUser) {
      return unauthorizedResponse('Giriş yapmanız gerekiyor');
    }

    if (currentUser.role !== 'ADMIN') {
      return errorResponse('Bu işlem için admin yetkisi gerekli', 403);
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'week'; // day, week, month, year, all

    // Tarih aralığını hesapla
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
        startDate = new Date('2020-01-01'); // Başlangıç tarihi
        break;
    }

    // 1. Genel İstatistikler
    const [
      totalUsers,
      totalBattles,
      totalWorkshops,
      totalWorkshopEnrollments,
      totalCompetitions,
      totalStudios,
      activeBattles,
      completedBattles,
      pendingBattles,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.battleRequest.count(),
      prisma.workshop.count(),
      prisma.workshopEnrollment.count(),
      prisma.competition.count(),
      prisma.studio.count(),
      prisma.battleRequest.count({
        where: {
          status: {
            in: ['PENDING', 'CHALLENGER_ACCEPTED', 'STUDIO_PENDING', 'CONFIRMED', 'BATTLE_SCHEDULED']
          }
        }
      }),
      prisma.battleRequest.count({ where: { status: 'COMPLETED' } }),
      prisma.battleRequest.count({ where: { status: 'PENDING' } }),
    ]);

    // 2. Dönemsel İstatistikler
    const [
      newUsersInPeriod,
      battlesInPeriod,
      workshopsInPeriod,
      completedBattlesInPeriod,
    ] = await Promise.all([
      prisma.user.count({
        where: { createdAt: { gte: startDate } }
      }),
      prisma.battleRequest.count({
        where: { createdAt: { gte: startDate } }
      }),
      prisma.workshop.count({
        where: { createdAt: { gte: startDate } }
      }),
      prisma.battleRequest.count({
        where: {
          status: 'COMPLETED',
          completedAt: { gte: startDate }
        }
      }),
    ]);

    // 3. Kullanıcı Dağılımı (Role göre)
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        role: true
      }
    });

    const roleDistribution = usersByRole.reduce((acc: any, item: any) => {
      acc[item.role] = item._count.role;
      return acc;
    }, {});

    // 4. En Aktif Dansçılar (En çok battle yapan)
    const topDancers = await prisma.user.findMany({
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
        _count: {
          select: {
            initiatedBattles: true,
            challengedBattles: true,
            wonBattles: true
          }
        }
      },
      orderBy: {
        rating: 'desc'
      },
      take: 10
    });

    const topDancersFormatted = topDancers.map(dancer => ({
      id: dancer.id,
      name: dancer.name,
      email: dancer.email,
      avatar: dancer.avatar,
      rating: dancer.rating,
      danceStyles: dancer.danceStyles,
      totalBattles: dancer._count.initiatedBattles + dancer._count.challengedBattles,
      wonBattles: dancer._count.wonBattles,
      winRate: dancer._count.initiatedBattles + dancer._count.challengedBattles > 0
        ? ((dancer._count.wonBattles / (dancer._count.initiatedBattles + dancer._count.challengedBattles)) * 100).toFixed(1)
        : 0
    }));

    // 5. En Popüler Stüdyolar (En çok battle yapılan)
    const topStudios = await prisma.studio.findMany({
      select: {
        id: true,
        name: true,
        city: true,
        address: true,
        _count: {
          select: {
            battleRequests: true
          }
        }
      },
      orderBy: {
        battleRequests: {
          _count: 'desc'
        }
      },
      take: 5
    });

    // 6. Battle Durum Dağılımı
    const battlesByStatus = await prisma.battleRequest.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });

    const statusDistribution = battlesByStatus.reduce((acc: any, item: any) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {});

    // 7. Günlük Battle Trendi (Son 7 gün)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      date.setHours(0, 0, 0, 0);
      return date;
    });

    const dailyBattles = await Promise.all(
      last7Days.map(async (date, index) => {
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const count = await prisma.battleRequest.count({
          where: {
            createdAt: {
              gte: date,
              lt: nextDate
            }
          }
        });

        return {
          date: date.toISOString().split('T')[0],
          label: date.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' }),
          count
        };
      })
    );

    // 8. Günlük Kullanıcı Kayıt Trendi (Son 7 gün)
    const dailyUsers = await Promise.all(
      last7Days.map(async (date) => {
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const count = await prisma.user.count({
          where: {
            createdAt: {
              gte: date,
              lt: nextDate
            }
          }
        });

        return {
          date: date.toISOString().split('T')[0],
          label: date.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' }),
          count
        };
      })
    );

    // 9. Workshop İstatistikleri
    const [
      activeWorkshops,
      upcomingWorkshops,
      totalEnrollments
    ] = await Promise.all([
      prisma.workshop.count({
        where: {
          isActive: true,
          isCancelled: false,
          scheduledDate: { gte: now }
        }
      }),
      prisma.workshop.count({
        where: {
          scheduledDate: { gte: now }
        }
      }),
      prisma.workshopEnrollment.count()
    ]);

    // 10. Gelir Raporları (Workshop kayıtları)
    const totalRevenue = await prisma.workshopEnrollment.aggregate({
      where: {
        isPaid: true
      },
      _sum: {
        paidAmount: true
      }
    });

    const revenueInPeriod = await prisma.workshopEnrollment.aggregate({
      where: {
        isPaid: true,
        enrolledAt: { gte: startDate }
      },
      _sum: {
        paidAmount: true
      }
    });

    const stats = {
      overview: {
        totalUsers,
        totalBattles,
        totalWorkshops,
        totalCompetitions,
        totalStudios,
        activeBattles,
        completedBattles,
        pendingBattles,
      },
      period: {
        name: period,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
        newUsers: newUsersInPeriod,
        battles: battlesInPeriod,
        workshops: workshopsInPeriod,
        completedBattles: completedBattlesInPeriod,
      },
      users: {
        distribution: roleDistribution,
        topDancers: topDancersFormatted,
      },
      battles: {
        statusDistribution,
        dailyTrend: dailyBattles,
        topStudios,
      },
      workshops: {
        active: activeWorkshops,
        upcoming: upcomingWorkshops,
        totalEnrollments,
      },
      revenue: {
        total: totalRevenue._sum.paidAmount || 0,
        inPeriod: revenueInPeriod._sum.paidAmount || 0,
        // ✅ %15 komisyon hesaplaması
        commission: {
          rate: 15, // %15 komisyon
          total: ((totalRevenue._sum.paidAmount || 0) * 0.15).toFixed(2),
          inPeriod: ((revenueInPeriod._sum.paidAmount || 0) * 0.15).toFixed(2),
        },
        instructor: {
          total: ((totalRevenue._sum.paidAmount || 0) * 0.85).toFixed(2),
          inPeriod: ((revenueInPeriod._sum.paidAmount || 0) * 0.85).toFixed(2),
        }
      },
      trends: {
        dailyBattles,
        dailyUsers,
      }
    };

    return successResponse(stats, 'İstatistikler başarıyla yüklendi');
  } catch (error) {
    console.error('Stats API error:', error);
    return errorResponse('İstatistikler yüklenirken hata oluştu', 500, error);
  }
}
