import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { verifyToken } from '@/lib/auth';

// Battle düzenle (sonuç değiştir)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const battleId = params.id;
    const body = await request.json();
    const { winnerId, scores } = body;

    if (!winnerId) {
      return errorResponse('winnerId gerekli', 400);
    }

    // Battle'ı bul
    const battle = await prisma.battle.findUnique({
      where: { id: battleId },
      include: {
        challenger: true,
        opponent: true,
      },
    });

    if (!battle) {
      return errorResponse('Battle bulunamadı', 404);
    }

    // Eski kazanan varsa puanını geri al
    if (battle.winnerId) {
      const oldWinner = battle.winnerId === battle.challengerId 
        ? battle.challenger 
        : battle.opponent;
      const oldLoser = battle.winnerId === battle.challengerId 
        ? battle.opponent 
        : battle.challenger;

      if (oldWinner && oldLoser) {
        // Puanları eski haline getir
        await prisma.user.update({
          where: { id: oldWinner.id },
          data: { rating: oldWinner.rating - 20 },
        });
        await prisma.user.update({
          where: { id: oldLoser.id },
          data: { rating: oldLoser.rating + 10 },
        });
      }
    }

    // Yeni kazananı belirle
    const newWinner = winnerId === battle.challengerId 
      ? battle.challenger 
      : battle.opponent;
    const newLoser = winnerId === battle.challengerId 
      ? battle.opponent 
      : battle.challenger;

    // Yeni puanları hesapla
    if (newWinner && newLoser) {
      await prisma.user.update({
        where: { id: newWinner.id },
        data: { rating: newWinner.rating + 20 },
      });
      await prisma.user.update({
        where: { id: newLoser.id },
        data: { rating: newLoser.rating - 10 },
      });
    }

    // Battle'ı güncelle
    const updatedBattle = await prisma.battle.update({
      where: { id: battleId },
      data: {
        winnerId,
        scores: scores || battle.scores,
      },
      include: {
        challenger: true,
        opponent: true,
        referee: true,
      },
    });

    return successResponse({
      battle: updatedBattle,
      message: 'Battle sonucu güncellendi',
    });
  } catch (error) {
    console.error('Update battle error:', error);
    return errorResponse('Battle güncellenemedi', 500);
  }
}

// Battle iptal et
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const battleId = params.id;

    // Battle'ı bul
    const battle = await prisma.battle.findUnique({
      where: { id: battleId },
      include: {
        challenger: true,
        opponent: true,
      },
    });

    if (!battle) {
      return errorResponse('Battle bulunamadı', 404);
    }

    // Eğer tamamlanmışsa ve kazanan varsa puanları geri al
    if (battle.status === 'COMPLETED' && battle.winnerId) {
      const winner = battle.winnerId === battle.challengerId 
        ? battle.challenger 
        : battle.opponent;
      const loser = battle.winnerId === battle.challengerId 
        ? battle.opponent 
        : battle.challenger;

      if (winner && loser) {
        await prisma.user.update({
          where: { id: winner.id },
          data: { rating: winner.rating - 20 },
        });
        await prisma.user.update({
          where: { id: loser.id },
          data: { rating: loser.rating + 10 },
        });
      }
    }

    // Battle'ı sil
    await prisma.battle.delete({
      where: { id: battleId },
    });

    return successResponse({
      message: 'Battle iptal edildi',
    });
  } catch (error) {
    console.error('Delete battle error:', error);
    return errorResponse('Battle iptal edilemedi', 500);
  }
}
