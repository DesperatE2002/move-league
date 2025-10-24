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

    // Get user's enrolled workshops
    const enrollments = await prisma.workshopEnrollment.findMany({
      where: {
        userId: decoded.userId
      },
      include: {
        workshop: {
          include: {
            instructor: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        }
      },
      orderBy: {
        enrolledAt: 'desc'
      }
    });

    return successResponse({
      workshops: enrollments
    });
  } catch (error) {
    console.error('Get enrolled workshops error:', error);
    return errorResponse('Failed to fetch enrolled workshops', 500);
  }
}
