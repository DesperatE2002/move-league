import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 });
    }

    // Onay bekleyen kullanıcıları getir
    const pendingUsers = await prisma.user.findMany({
      where: {
        isApproved: false,
        role: {
          in: ['INSTRUCTOR', 'REFEREE']
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        danceStyles: true,
        experience: true,
        bio: true,
        createdAt: true,
        avatar: true,
        phone: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        pendingUsers,
        count: pendingUsers.length
      }
    });
  } catch (error: any) {
    console.error('Get pending users error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to get pending users' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 });
    }

    const { userId, approved } = await request.json();

    if (approved) {
      // Onaylama
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          isApproved: true,
          approvedAt: new Date(),
          approvedBy: decoded.userId,
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Kullanıcı onaylandı',
        data: { user }
      });
    } else {
      // Reddetme - kullanıcıyı sil
      await prisma.user.delete({
        where: { id: userId }
      });

      return NextResponse.json({
        success: true,
        message: 'Kullanıcı reddedildi ve silindi'
      });
    }
  } catch (error: any) {
    console.error('Approve/reject user error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Operation failed' },
      { status: 500 }
    );
  }
}
