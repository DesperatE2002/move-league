import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// GET /api/workshops - Tüm workshopları listele
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const level = searchParams.get('level');
    const isActive = searchParams.get('isActive');

    const where: any = {};

    if (category) {
      where.category = category;
    }

    if (level) {
      where.level = level;
    }

    if (isActive !== null) {
      where.isActive = isActive === 'true';
      where.isCancelled = false;
    }

    const workshops = await prisma.workshop.findMany({
      where,
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            danceStyles: true,
            experience: true,
          },
        },
        enrollments: {
          select: {
            id: true,
            userId: true,
            isPaid: true,
          },
        },
      },
      orderBy: {
        scheduledDate: 'asc',
      },
    });

    return NextResponse.json(workshops);
  } catch (error) {
    console.error('Get workshops error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workshops' },
      { status: 500 }
    );
  }
}

// POST /api/workshops - Yeni workshop oluştur (sadece INSTRUCTOR)
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!currentUser || currentUser.role !== 'INSTRUCTOR') {
      return NextResponse.json(
        { error: 'Only instructors can create workshops' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      category,
      level,
      description,
      requirements,
      videoUrl,
      thumbnailUrl,
      scheduledDate,
      scheduledTime,
      duration,
      location,
      address,
      capacity,
      price,
    } = body;

    // Validasyon
    if (!title || !category || !level || !description || !scheduledDate || !scheduledTime || !duration || !location || !capacity || price === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const workshop = await prisma.workshop.create({
      data: {
        title,
        instructorId: currentUser.id,
        category,
        level,
        description,
        requirements,
        videoUrl,
        thumbnailUrl,
        scheduledDate: new Date(scheduledDate),
        scheduledTime,
        duration,
        location,
        address,
        capacity,
        price,
      },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json(workshop, { status: 201 });
  } catch (error) {
    console.error('Create workshop error:', error);
    return NextResponse.json(
      { error: 'Failed to create workshop' },
      { status: 500 }
    );
  }
}
