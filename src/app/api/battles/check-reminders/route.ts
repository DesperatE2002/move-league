// GET /api/battles/check-reminders
// Battle hatırlatmalarını kontrol et ve gönder
// Not: Bu endpoint'i periyodik olarak çağırmak için external cron servisi kullanılabilir

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in1Hour = new Date(now.getTime() + 60 * 60 * 1000);

    // 24 saat sonra olan battle'lar (henüz hatırlatma gönderilmemiş)
    const battles24h = await prisma.battleRequest.findMany({
      where: {
        status: {
          in: ['BATTLE_SCHEDULED', 'CONFIRMED'],
        },
        scheduledDate: {
          gte: now,
          lte: in24Hours,
        },
        reminder24hSent: false,
      },
      include: {
        initiator: { select: { id: true, name: true } },
        challenged: { select: { id: true, name: true } },
        selectedStudio: { select: { name: true, address: true } },
      },
    });

    // 1 saat sonra olan battle'lar (henüz hatırlatma gönderilmemiş)
    const battles1h = await prisma.battleRequest.findMany({
      where: {
        status: {
          in: ['BATTLE_SCHEDULED', 'CONFIRMED'],
        },
        scheduledDate: {
          gte: now,
          lte: in1Hour,
        },
        reminder1hSent: false,
      },
      include: {
        initiator: { select: { id: true, name: true } },
        challenged: { select: { id: true, name: true } },
        selectedStudio: { select: { name: true, address: true } },
      },
    });

    let sentCount = 0;

    // 24 saat hatırlatmaları gönder
    for (const battle of battles24h) {
      const message = `🔔 Hatırlatma: ${battle.title || 'Battle'} yarın saat ${battle.scheduledTime}'de ${battle.selectedStudio?.name || 'stüdyoda'}. Hazır olun!`;

      await Promise.all([
        // Initiator'a bildirim
        prisma.notification.create({
          data: {
            userId: battle.initiatorId,
            type: 'GENERAL',
            title: '⏰ Battle Yaklaşıyor (24 saat)',
            message,
            battleRequestId: battle.id,
          },
        }),
        // Challenged'a bildirim
        prisma.notification.create({
          data: {
            userId: battle.challengedId,
            type: 'GENERAL',
            title: '⏰ Battle Yaklaşıyor (24 saat)',
            message,
            battleRequestId: battle.id,
          },
        }),
        // Battle'ı güncelle
        prisma.battleRequest.update({
          where: { id: battle.id },
          data: { reminder24hSent: true },
        }),
      ]);

      sentCount += 2;
    }

    // 1 saat hatırlatmaları gönder
    for (const battle of battles1h) {
      const message = `🔔 ACİL: ${battle.title || 'Battle'} 1 saat içinde başlayacak! Saat ${battle.scheduledTime}, yer: ${battle.selectedStudio?.address || battle.location}`;

      await Promise.all([
        // Initiator'a bildirim
        prisma.notification.create({
          data: {
            userId: battle.initiatorId,
            type: 'GENERAL',
            title: '⏰ Battle Çok Yakında! (1 saat)',
            message,
            battleRequestId: battle.id,
          },
        }),
        // Challenged'a bildirim
        prisma.notification.create({
          data: {
            userId: battle.challengedId,
            type: 'GENERAL',
            title: '⏰ Battle Çok Yakında! (1 saat)',
            message,
            battleRequestId: battle.id,
          },
        }),
        // Battle'ı güncelle
        prisma.battleRequest.update({
          where: { id: battle.id },
          data: { reminder1hSent: true },
        }),
      ]);

      sentCount += 2;
    }

    return successResponse(
      {
        battles24h: battles24h.length,
        battles1h: battles1h.length,
        notificationsSent: sentCount,
      },
      `${sentCount} hatırlatma bildirimi gönderildi`
    );
  } catch (error) {
    console.error('Check reminders error:', error);
    return errorResponse('Hatırlatmalar kontrol edilemedi', 500, error);
  }
}
