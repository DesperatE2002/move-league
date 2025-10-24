import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Yarışma detayı
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Token gerekli' }, { status: 401 });
    }

    jwt.verify(token, JWT_SECRET);

    const competition = await prisma.competition.findUnique({
      where: { id: params.id },
      include: {
        teams: {
          include: {
            leader: {
              select: {
                id: true,
                name: true,
                avatar: true,
                role: true
              }
            },
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatar: true,
                    danceStyles: true
                  }
                }
              }
            },
            _count: {
              select: {
                members: true,
                invitations: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    });

    if (!competition) {
      return NextResponse.json({ error: 'Yarışma bulunamadı' }, { status: 404 });
    }

    return NextResponse.json({ success: true, competition });
  } catch (error: any) {
    console.error('Get competition error:', error);
    return NextResponse.json(
      { error: error.message || 'Yarışma yüklenemedi' },
      { status: 500 }
    );
  }
}

// Yarışma güncelle (sadece ADMIN)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Token gerekli' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };

    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Sadece adminler yarışma güncelleyebilir' }, { status: 403 });
    }

    const body = await request.json();

    const competition = await prisma.competition.update({
      where: { id: params.id },
      data: body
    });

    return NextResponse.json({ 
      success: true, 
      competition,
      message: 'Yarışma güncellendi' 
    });
  } catch (error: any) {
    console.error('Update competition error:', error);
    return NextResponse.json(
      { error: error.message || 'Yarışma güncellenemedi' },
      { status: 500 }
    );
  }
}

// Yarışma sil (sadece ADMIN)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Token gerekli' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };

    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Sadece adminler yarışma silebilir' }, { status: 403 });
    }

    await prisma.competition.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Yarışma silindi' 
    });
  } catch (error: any) {
    console.error('Delete competition error:', error);
    return NextResponse.json(
      { error: error.message || 'Yarışma silinemedi' },
      { status: 500 }
    );
  }
}
