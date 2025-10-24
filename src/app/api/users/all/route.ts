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

    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        danceStyles: true,
        experience: true,
        rating: true,
        badges: true,
        studioName: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return successResponse({
      users
    });
  } catch (error) {
    console.error('Get all users error:', error);
    return errorResponse('Failed to fetch users', 500);
  }
}
