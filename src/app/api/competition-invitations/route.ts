import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Davetleri listele (Dansçılar için)
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Token gerekli' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    // Query parametreleri
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'PENDING';

    const invitations = await prisma.competitionInvitation.findMany({
      where: {
        receiverId: decoded.userId,
        status
      },
      include: {
        team: {
          include: {
            competition: {
              select: {
                id: true,
                name: true,
                eventDate: true,
                location: true,
                venue: true,
                songRevealed: true,
                songTitle: true,
                songArtist: true
              }
            },
            leader: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            },
            _count: {
              select: {
                members: true
              }
            }
          }
        },
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ success: true, invitations });
  } catch (error: any) {
    console.error('Get invitations error:', error);
    return NextResponse.json(
      { error: error.message || 'Davetler yüklenemedi' },
      { status: 500 }
    );
  }
}
