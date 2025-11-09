// GET /api/battles/[id]
// Belirli bir battle'ın detaylarını getir

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/api-response';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const currentUser = getUserFromRequest(request);
    if (!currentUser) {
      return unauthorizedResponse('Giriş yapmanız gerekiyor');
    }

    const battleId = params.id;

    // Battle'ı bul
    const battle = await prisma.battleRequest.findUnique({
      where: { id: battleId },
      include: {
        initiator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            rating: true,
            danceStyles: true,
          },
        },
        challenged: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            rating: true,
            danceStyles: true,
          },
        },
        referee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        winner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        studioPreferences: {
          include: {
            studio: {
              select: {
                id: true,
                name: true,
                address: true,
                city: true,
                capacity: true,
                pricePerHour: true,
              },
            },
          },
          orderBy: {
            priority: 'asc',
          },
        },
      },
    });

    if (!battle) {
      return notFoundResponse('Battle bulunamadı');
    }

    return successResponse(battle, 'Battle detayları getirildi');
  } catch (error) {
    console.error('Get battle error:', error);
    return errorResponse('Battle detayları alınamadı', 500, error);
  }
}

// PATCH /api/battles/[id]
// Battle güncelleme (onaylama, reddetme, stüdyo seçimi)

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

        // Battle'ı reddedeni cezalandır (-10 puan)
        // Eğer meydan okunan red ediyorsa, sadece o ceza alır
        if (currentUser.userId === battle.challengedId) {
          await prisma.user.update({
            where: { id: battle.challengedId },
            data: {
              rating: {
                decrement: 10
              }
            }
          });
        }

        const updatedBattle = await prisma.battleRequest.update({
          where: { id: battleId },
          data: { status: 'REJECTED' },
        });

        // Bildirim gönder
        const notifyUserId = currentUser.userId === battle.initiatorId ? battle.challengedId : battle.initiatorId;
        const rejecterName = currentUser.userId === battle.initiatorId ? battle.initiator.name : battle.challenged.name;
        
        await prisma.notification.create({
          data: {
            userId: notifyUserId,
            type: 'BATTLE_REJECTED',
            title: 'Battle Reddedildi',
            message: `${rejecterName} battle'ı reddetti${currentUser.userId === battle.challengedId ? ' ve -10 puan kaybetti' : ''}.`,
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

      case 'ASSIGN_REFEREE': {
        // Admin hakem ataması
        if (currentUser.role !== 'ADMIN') {
          return errorResponse('Sadece admin hakem atayabilir', 403);
        }

        const { refereeId } = body;
        if (!refereeId) {
          return errorResponse('Hakem ID gerekli', 400);
        }

        // Hakem kontrolü
        const referee = await prisma.user.findUnique({
          where: { id: refereeId },
        });

        if (!referee || referee.role !== 'REFEREE') {
          return errorResponse('Geçerli bir hakem seçiniz', 400);
        }

        // Battle'a hakem ata
        const updatedBattle = await prisma.battleRequest.update({
          where: { id: battleId },
          data: { refereeId: refereeId },
          include: {
            initiator: { select: { id: true, name: true, email: true } },
            challenged: { select: { id: true, name: true, email: true } },
            referee: { select: { id: true, name: true, email: true } },
          },
        });

        // Hakeme bildirim gönder
        await prisma.notification.create({
          data: {
            userId: refereeId,
            type: 'GENERAL',
            title: 'Hakem Görevlendirildiniz',
            message: `${battle.initiator.name} vs ${battle.challenged.name} battle'ına hakem olarak atandınız.`,
            battleRequestId: battleId,
          },
        });

        return successResponse(updatedBattle, 'Hakem başarıyla atandı');
      }

      case 'SINGLE_NO_SHOW': {
        // Tek katılımcı gelmedi
        if (currentUser.role !== 'REFEREE') {
          return errorResponse('Sadece hakemler bu işlemi yapabilir', 403);
        }

        if (battle.refereeId !== currentUser.userId) {
          return errorResponse('Bu battle\'a atanmış hakem değilsiniz', 403);
        }

        const { initiatorNoShow, challengedNoShow, winnerId } = body;

        if (!winnerId) {
          return errorResponse('Kazanan ID gerekli', 400);
        }

        const loserId = winnerId === battle.initiatorId ? battle.challengedId : battle.initiatorId;

        // Gelmeyene -50 puan cezası
        await prisma.user.update({
          where: { id: loserId },
          data: { rating: { decrement: 50 } },
        });

        // Battle'ı tamamla (kazanan puan almaz)
        await prisma.battleRequest.update({
          where: { id: battleId },
          data: {
            status: 'COMPLETED',
            winnerId: winnerId,
            initiatorNoShow: initiatorNoShow,
            challengedNoShow: challengedNoShow,
            completedAt: new Date(),
          },
        });

        // Bildirimleri gönder
        const noShowUser = loserId === battle.initiatorId ? battle.initiator : battle.challenged;
        const winnerUser = winnerId === battle.initiatorId ? battle.initiator : battle.challenged;

        await prisma.notification.create({
          data: {
            userId: loserId,
            type: 'GENERAL',
            title: 'Battle: Gelmeme Cezası',
            message: `${battle.title || 'Battle'}'a katılmadınız. -50 puan cezası aldınız.`,
            battleRequestId: battleId,
          },
        });

        await prisma.notification.create({
          data: {
            userId: winnerId,
            type: 'GENERAL',
            title: 'Battle: Otomatik Kazandınız',
            message: `${noShowUser.name} battle'a katılmadı. Otomatik kazandınız (puan artışı yok).`,
            battleRequestId: battleId,
          },
        });

        return successResponse({ success: true }, 'No-show cezası uygulandı');
      }

      case 'BOTH_NO_SHOW': {
        // Her iki katılımcı da gelmedi
        if (currentUser.role !== 'REFEREE') {
          return errorResponse('Sadece hakemler bu işlemi yapabilir', 403);
        }

        if (battle.refereeId !== currentUser.userId) {
          return errorResponse('Bu battle\'a atanmış hakem değilsiniz', 403);
        }

        // Her ikisine de -50 puan cezası
        await Promise.all([
          prisma.user.update({
            where: { id: battle.initiatorId },
            data: { rating: { decrement: 50 } },
          }),
          prisma.user.update({
            where: { id: battle.challengedId },
            data: { rating: { decrement: 50 } },
          }),
        ]);

        // Battle'ı iptal et
        await prisma.battleRequest.update({
          where: { id: battleId },
          data: {
            status: 'CANCELLED',
            initiatorNoShow: true,
            challengedNoShow: true,
            completedAt: new Date(),
          },
        });

        // Bildirimleri gönder
        await Promise.all([
          prisma.notification.create({
            data: {
              userId: battle.initiatorId,
              type: 'GENERAL',
              title: 'Battle İptal: Gelmeme Cezası',
              message: `${battle.title || 'Battle'}'a katılmadınız. -50 puan cezası aldınız.`,
              battleRequestId: battleId,
            },
          }),
          prisma.notification.create({
            data: {
              userId: battle.challengedId,
              type: 'GENERAL',
              title: 'Battle İptal: Gelmeme Cezası',
              message: `${battle.title || 'Battle'}'a katılmadınız. -50 puan cezası aldınız.`,
              battleRequestId: battleId,
            },
          }),
        ]);

        return successResponse({ success: true }, 'Her iki katılımcıya da ceza uygulandı');
      }

      case 'START_LIVE': {
        // Battle'ı canlı duruma getir
        if (currentUser.role !== 'REFEREE' && currentUser.role !== 'ADMIN') {
          return errorResponse('Sadece hakem veya admin bu işlemi yapabilir', 403);
        }

        if (battle.status !== 'BATTLE_SCHEDULED' && battle.status !== 'CONFIRMED') {
          return errorResponse('Battle henüz planlanmamış', 400);
        }

        const updatedBattle = await prisma.battleRequest.update({
          where: { id: battleId },
          data: { status: 'LIVE' },
        });

        // Katılımcılara bildirim
        await Promise.all([
          prisma.notification.create({
            data: {
              userId: battle.initiatorId,
              type: 'GENERAL',
              title: 'Battle Başladı! 🔴 LIVE',
              message: `${battle.title || 'Battle'} artık canlı!`,
              battleRequestId: battleId,
            },
          }),
          prisma.notification.create({
            data: {
              userId: battle.challengedId,
              type: 'GENERAL',
              title: 'Battle Başladı! 🔴 LIVE',
              message: `${battle.title || 'Battle'} artık canlı!`,
              battleRequestId: battleId,
            },
          }),
        ]);

        return successResponse(updatedBattle, 'Battle canlı duruma getirildi');
      }

      case 'SUBMIT_SCORES': {
        // Hakem puanlama sistemi
        if (currentUser.role !== 'REFEREE') {
          return errorResponse('Sadece hakemler puanlama yapabilir', 403);
        }

        // Hakeme atanmış mı kontrol
        if (battle.refereeId !== currentUser.userId) {
          return errorResponse('Bu battle\'a atanmış hakem değilsiniz', 403);
        }

        const { scores, winnerId } = body;
        if (!scores || !scores.initiator || !scores.challenged) {
          return errorResponse('Puanlar eksik', 400);
        }

        // Kazanan kontrolü
        let finalWinnerId = winnerId;
        if (!winnerId) {
          // Beraberlik durumu - status COMPLETED olacak ama kazanan olmayacak
          finalWinnerId = null;
        } else {
          // Kazananın battle katılımcısı olduğunu kontrol et
          if (winnerId !== battle.initiatorId && winnerId !== battle.challengedId) {
            return errorResponse('Geçersiz kazanan ID', 400);
          }
        }

        try {
          // Battle'ı güncelle - puanları ve kazananı kaydet
          const updatedBattle = await prisma.battleRequest.update({
            where: { id: battleId },
            data: {
              status: 'COMPLETED',
              winnerId: finalWinnerId,
              scores: scores, // JSON olarak kaydedilecek
              completedAt: new Date(),
            },
            include: {
              initiator: { select: { id: true, name: true, email: true } },
              challenged: { select: { id: true, name: true, email: true } },
              referee: { select: { id: true, name: true, email: true } },
            },
          });

          // Katılımcılara bildirim gönder
          const winnerName = finalWinnerId 
            ? (finalWinnerId === battle.initiatorId ? battle.initiator.name : battle.challenged.name)
            : 'Berabere';

          // Rating güncellemeleri
          // Kazanan: +20, Beraberlik: +10, Kaybeden: -10
          if (finalWinnerId) {
            // Kazanan var
            const loserId = finalWinnerId === battle.initiatorId ? battle.challengedId : battle.initiatorId;
            
            await Promise.all([
              // Kazanan +20
              prisma.user.update({
                where: { id: finalWinnerId },
                data: {
                  rating: { increment: 20 }
                }
              }),
              // Kaybeden -10
              prisma.user.update({
                where: { id: loserId },
                data: {
                  rating: { decrement: 10 }
                }
              })
            ]);
          } else {
            // Beraberlik - Her ikisi de +10
            await Promise.all([
              prisma.user.update({
                where: { id: battle.initiatorId },
                data: {
                  rating: { increment: 10 }
                }
              }),
              prisma.user.update({
                where: { id: battle.challengedId },
                data: {
                  rating: { increment: 10 }
                }
              })
            ]);
          }

          await Promise.all([
            prisma.notification.create({
              data: {
                userId: battle.initiatorId,
                type: 'GENERAL',
                title: 'Battle Tamamlandı',
                message: `${battle.initiator.name} vs ${battle.challenged.name} battle'ı puanlandı. Kazanan: ${winnerName}. Rating ${finalWinnerId === battle.initiatorId ? '+20' : finalWinnerId ? '-10' : '+10'}`,
                battleRequestId: battleId,
              },
            }),
            prisma.notification.create({
              data: {
                userId: battle.challengedId,
                type: 'GENERAL',
                title: 'Battle Tamamlandı',
                message: `${battle.initiator.name} vs ${battle.challenged.name} battle'ı puanlandı. Kazanan: ${winnerName}. Rating ${finalWinnerId === battle.challengedId ? '+20' : finalWinnerId ? '-10' : '+10'}`,
                battleRequestId: battleId,
              },
            }),
          ]);

          return successResponse(updatedBattle, 'Puanlama başarıyla kaydedildi');
        } catch (scoreError: any) {
          console.error('❌ SUBMIT_SCORES error:', scoreError);
          return errorResponse('Puanlama kaydedilemedi: ' + scoreError.message, 500, scoreError);
        }
      }

      default:
        return errorResponse('Geçersiz action', 400);
    }
  } catch (error) {
    console.error('Update battle error:', error);
    return errorResponse('Battle güncellenemedi', 500, error);
  }
}
