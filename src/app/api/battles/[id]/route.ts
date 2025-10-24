// PATCH /api/battles/[id]
// Battle güncelleme (onaylama, reddetme, stüdyo seçimi)

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api-response';
import { getUserFromRequest } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = getUserFromRequest(request);
    if (!currentUser) {
      return unauthorizedResponse('Giriş yapmanız gerekiyor');
    }

    const battleId = params.id;
    const body = await request.json();
    const { action, studioPreferences, scheduledDate, scheduledTime, location, duration } = body;

    // Battle'ı bul
    const battle = await prisma.battleRequest.findUnique({
      where: { id: battleId },
      include: {
        initiator: { select: { id: true, name: true, email: true } },
        challenged: { select: { id: true, name: true, email: true } },
      },
    });

    if (!battle) {
      return notFoundResponse('Battle bulunamadı');
    }

    // Action'a göre işlem yap
    switch (action) {
      case 'ACCEPT': {
        // Challenged user battle'ı kabul ediyor
        if (currentUser.userId !== battle.challengedId) {
          return errorResponse('Sadece davet edilen kişi kabul edebilir', 403);
        }

        if (battle.status !== 'PENDING') {
          return errorResponse('Bu battle zaten işlenmiş', 400);
        }

        const updatedBattle = await prisma.battleRequest.update({
          where: { id: battleId },
          data: { status: 'CHALLENGER_ACCEPTED' },
        });

        // Bildirim gönder
        await prisma.notification.create({
          data: {
            userId: battle.initiatorId,
            type: 'BATTLE_ACCEPTED',
            title: 'Battle Kabul Edildi',
            message: `${battle.challenged.name} battle talebini kabul etti! Şimdi stüdyo seçimi yapın.`,
            battleRequestId: battleId,
          },
        });

        return successResponse(updatedBattle, 'Battle kabul edildi');
      }

      case 'REJECT': {
        // Battle reddediliyor
        if (currentUser.userId !== battle.challengedId && currentUser.userId !== battle.initiatorId) {
          return errorResponse('Bu battle\'ı reddetme yetkiniz yok', 403);
        }

        const updatedBattle = await prisma.battleRequest.update({
          where: { id: battleId },
          data: { status: 'REJECTED' },
        });

        // Bildirim gönder
        const notifyUserId = currentUser.userId === battle.initiatorId ? battle.challengedId : battle.initiatorId;
        await prisma.notification.create({
          data: {
            userId: notifyUserId,
            type: 'BATTLE_REJECTED',
            title: 'Battle Reddedildi',
            message: `Battle talebiniz reddedildi.`,
            battleRequestId: battleId,
          },
        });

        return successResponse(updatedBattle, 'Battle reddedildi');
      }

      case 'SELECT_STUDIOS': {
        // Stüdyo tercihleri kaydet
        if (!studioPreferences || studioPreferences.length === 0) {
          return errorResponse('En az bir stüdyo seçmelisiniz', 400);
        }

        if (battle.status !== 'CHALLENGER_ACCEPTED') {
          return errorResponse('Bu aşamada stüdyo seçimi yapılamaz', 400);
        }

        // Mevcut tercihleri sil ve yenilerini ekle
        await prisma.studioPreference.deleteMany({
          where: {
            battleRequestId: battleId,
            userId: currentUser.userId,
          },
        });

        // Yeni tercihleri kaydet
        await Promise.all(
          studioPreferences.map((pref: { studioId: string; priority: number }) =>
            prisma.studioPreference.create({
              data: {
                battleRequestId: battleId,
                userId: currentUser.userId,
                studioId: pref.studioId,
                priority: pref.priority,
              },
            })
          )
        );

        // Her iki taraf da seçim yaptı mı kontrol et
        const allPreferences = await prisma.studioPreference.findMany({
          where: { battleRequestId: battleId },
        });

        const initiatorSelected = allPreferences.some((p: any) => p.userId === battle.initiatorId);
        const challengedSelected = allPreferences.some((p: any) => p.userId === battle.challengedId);

        if (initiatorSelected && challengedSelected) {
          // Ortak stüdyo bul (her ikisinin de 1. tercihi önce)
          const initiatorPrefs = allPreferences.filter((p: any) => p.userId === battle.initiatorId).sort((a: any, b: any) => a.priority - b.priority);
          const challengedPrefs = allPreferences.filter((p: any) => p.userId === battle.challengedId).sort((a: any, b: any) => a.priority - b.priority);

          let selectedStudioId: string | null = null;

          // Önce aynı öncelik sırasındaki ortak stüdyoları kontrol et
          for (const initPref of initiatorPrefs) {
            const match = challengedPrefs.find((cp: any) => cp.studioId === initPref.studioId);
            if (match) {
              selectedStudioId = initPref.studioId;
              break;
            }
          }

          if (selectedStudioId) {
            // Battle'ı güncelle ve stüdyoya bildirim gönder
            await prisma.battleRequest.update({
              where: { id: battleId },
              data: {
                selectedStudioId,
                status: 'STUDIO_PENDING',
              },
            });

            // Stüdyoyu bul
            const studio = await prisma.studio.findUnique({
              where: { id: selectedStudioId },
            });

            if (studio) {
              await prisma.notification.create({
                data: {
                  userId: studio.userId,
                  type: 'STUDIO_REQUEST',
                  title: 'Yeni Stüdyo Talebi',
                  message: `${battle.initiator.name} ve ${battle.challenged.name} stüdyonuzda battle atmak istiyor.`,
                  battleRequestId: battleId,
                  studioId: selectedStudioId,
                },
              });
            }
          }
        }

        return successResponse({ success: true }, 'Stüdyo tercihleri kaydedildi');
      }

      case 'STUDIO_APPROVE': {
        // Stüdyo battle'ı onaylıyor
        if (currentUser.role !== 'STUDIO') {
          return errorResponse('Sadece stüdyolar onaylayabilir', 403);
        }

        if (battle.status !== 'STUDIO_PENDING') {
          return errorResponse('Bu battle stüdyo onayı bekliyor değil', 400);
        }

        if (!scheduledDate || !scheduledTime || !location) {
          return errorResponse('Tarih, saat ve konum gerekli', 400);
        }

        const updatedBattle = await prisma.battleRequest.update({
          where: { id: battleId },
          data: {
            status: 'CONFIRMED',
            scheduledDate: new Date(scheduledDate),
            scheduledTime,
            location,
            duration: duration || 60,
          },
        });

        // Her iki dansçıya bildirim gönder
        await Promise.all([
          prisma.notification.create({
            data: {
              userId: battle.initiatorId,
              type: 'BATTLE_SCHEDULED',
              title: 'Battle Onaylandı',
              message: `Battle ${scheduledDate} tarihinde ${scheduledTime} saatinde ${location} adresinde gerçekleşecek.`,
              battleRequestId: battleId,
            },
          }),
          prisma.notification.create({
            data: {
              userId: battle.challengedId,
              type: 'BATTLE_SCHEDULED',
              title: 'Battle Onaylandı',
              message: `Battle ${scheduledDate} tarihinde ${scheduledTime} saatinde ${location} adresinde gerçekleşecek.`,
              battleRequestId: battleId,
            },
          }),
        ]);

        return successResponse(updatedBattle, 'Battle onaylandı ve planlandı');
      }

      case 'STUDIO_REJECT': {
        // Stüdyo battle'ı reddediyor
        if (currentUser.role !== 'STUDIO') {
          return errorResponse('Sadece stüdyolar reddedebilir', 403);
        }

        await prisma.battleRequest.update({
          where: { id: battleId },
          data: { status: 'STUDIO_REJECTED' },
        });

        // Dansçılara bildirim gönder
        await Promise.all([
          prisma.notification.create({
            data: {
              userId: battle.initiatorId,
              type: 'STUDIO_REJECTED',
              title: 'Stüdyo Talebi Reddedildi',
              message: 'Stüdyo battle talebinizi reddetti. Lütfen farklı bir stüdyo seçin.',
              battleRequestId: battleId,
            },
          }),
          prisma.notification.create({
            data: {
              userId: battle.challengedId,
              type: 'STUDIO_REJECTED',
              title: 'Stüdyo Talebi Reddedildi',
              message: 'Stüdyo battle talebinizi reddetti. Lütfen farklı bir stüdyo seçin.',
              battleRequestId: battleId,
            },
          }),
        ]);

        return successResponse({ success: true }, 'Battle stüdyo tarafından reddedildi');
      }

      default:
        return errorResponse('Geçersiz action', 400);
    }
  } catch (error) {
    console.error('Update battle error:', error);
    return errorResponse('Battle güncellenemedi', 500, error);
  }
}
