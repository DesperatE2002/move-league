import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Get current user from token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse('Unauthorized', 401);
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return errorResponse('Invalid token', 401);
    }

    // Get all active battles that are confirmed by studio (CONFIRMED status)
    const battles = await prisma.battleRequest.findMany({
      where: {
        status: {
          in: ['CONFIRMED', 'BATTLE_SCHEDULED', 'COMPLETED']
        }
      },
      include: {
        initiator: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            danceStyles: true
          }
        },
        challenged: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            danceStyles: true
          }
        },
        selectedStudio: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            phone: true
          }
        }
      },
      orderBy: {
        scheduledDate: 'asc'
      }
    });

    return successResponse({
      battles
    });
  } catch (error) {
    console.error('Get active battles error:', error);
    return errorResponse('Failed to fetch active battles', 500);
  }
}
