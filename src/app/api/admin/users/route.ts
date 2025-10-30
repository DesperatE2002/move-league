import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { verifyToken } from '@/lib/auth';

// Kullanıcı listele
export async function GET(request: NextRequest) {
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

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        rating: true,
        badges: true,
        danceStyle: true,
        avatar: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse({ users });
  } catch (error) {
    console.error('Get users error:', error);
    return errorResponse('Kullanıcılar getirilemedi', 500);
  }
}

// Kullanıcı düzenle (rol değiştir, aktif/pasif yap)
export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const { userId, role, isActive } = body;

    if (!userId) {
      return errorResponse('userId gerekli', 400);
    }

    // Güncelleme objesi
    const updateData: any = {};
    if (role) updateData.role = role;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    return successResponse({
      user: updatedUser,
      message: 'Kullanıcı güncellendi',
    });
  } catch (error) {
    console.error('Update user error:', error);
    return errorResponse('Kullanıcı güncellenemedi', 500);
  }
}

// Kullanıcı sil
export async function DELETE(request: NextRequest) {
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

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return errorResponse('userId gerekli', 400);
    }

    // Kendini silemesin
    if (userId === decoded.userId) {
      return errorResponse('Kendi hesabınızı silemezsiniz', 400);
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return successResponse({
      message: 'Kullanıcı silindi',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return errorResponse('Kullanıcı silinemedi', 500);
  }
}
