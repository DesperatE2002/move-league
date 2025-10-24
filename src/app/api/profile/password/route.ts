import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { verifyToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function PATCH(request: NextRequest) {
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

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return errorResponse('Mevcut şifre ve yeni şifre gerekli', 400);
    }

    if (newPassword.length < 6) {
      return errorResponse('Yeni şifre en az 6 karakter olmalı', 400);
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        password: true
      }
    });

    if (!user) {
      return errorResponse('Kullanıcı bulunamadı', 404);
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return errorResponse('Mevcut şifre yanlış', 400);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: decoded.userId },
      data: { password: hashedPassword }
    });

    return successResponse({
      message: 'Şifre başarıyla değiştirildi'
    });
  } catch (error) {
    console.error('Password change error:', error);
    return errorResponse('Şifre değiştirme başarısız', 500);
  }
}
