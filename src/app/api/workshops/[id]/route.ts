import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

// GET /api/workshops/[id] - Tek workshop detayı
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const workshop = await prisma.workshop.findUnique({
      where: { id: params.id },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            danceStyles: true,
            experience: true,
            bio: true,
          },
        },
        enrollments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!workshop) {
      return NextResponse.json(
        { error: 'Workshop not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(workshop);
  } catch (error) {
    console.error('Get workshop error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workshop' },
      { status: 500 }
    );
  }
}

// PATCH /api/workshops/[id] - Workshop güncelle veya kayıt ol
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { action } = body;

    // ENROLL - Dansçı workshop'a kayıt olur
    if (action === 'ENROLL') {
      const workshop = await prisma.workshop.findUnique({
        where: { id: params.id },
        include: {
          enrollments: true,
        },
      });

      if (!workshop) {
        return NextResponse.json(
          { error: 'Workshop not found' },
          { status: 404 }
        );
      }

      if (!workshop.isActive || workshop.isCancelled) {
        return NextResponse.json(
          { error: 'Workshop is not available' },
          { status: 400 }
        );
      }

      if (workshop.currentParticipants >= workshop.capacity) {
        return NextResponse.json(
          { error: 'Workshop is full' },
          { status: 400 }
        );
      }

      // Zaten kayıtlı mı kontrol et
      const existingEnrollment = await prisma.workshopEnrollment.findUnique({
        where: {
          workshopId_userId: {
            workshopId: params.id,
            userId: currentUser.id,
          },
        },
      });

      if (existingEnrollment) {
        return NextResponse.json(
          { error: 'Already enrolled' },
          { status: 400 }
        );
      }

      // Kayıt oluştur
      const enrollment = await prisma.workshopEnrollment.create({
        data: {
          workshopId: params.id,
          userId: currentUser.id,
          isPaid: true, // Şimdilik otomatik ödendi kabul ediyoruz
          paidAmount: workshop.price,
          paymentDate: new Date(),
        },
      });

      // Workshop participant sayısını artır
      await prisma.workshop.update({
        where: { id: params.id },
        data: {
          currentParticipants: workshop.currentParticipants + 1,
        },
      });

      return NextResponse.json({
        message: 'Successfully enrolled',
        enrollment,
      });
    }

    // UPDATE - Sadece eğitmen kendi workshop'ını güncelleyebilir
    if (action === 'UPDATE') {
      const workshop = await prisma.workshop.findUnique({
        where: { id: params.id },
      });

      if (!workshop) {
        return NextResponse.json(
          { error: 'Workshop not found' },
          { status: 404 }
        );
      }

      if (workshop.instructorId !== currentUser.id) {
        return NextResponse.json(
          { error: 'Only the instructor can update this workshop' },
          { status: 403 }
        );
      }

      const updateData: any = {};
      const allowedFields = [
        'title',
        'category',
        'level',
        'description',
        'requirements',
        'videoUrl',
        'thumbnailUrl',
        'scheduledDate',
        'scheduledTime',
        'duration',
        'location',
        'address',
        'capacity',
        'price',
        'isActive',
        'isCancelled',
      ];

      allowedFields.forEach((field) => {
        if (body[field] !== undefined) {
          if (field === 'scheduledDate') {
            updateData[field] = new Date(body[field]);
          } else {
            updateData[field] = body[field];
          }
        }
      });

      const updatedWorkshop = await prisma.workshop.update({
        where: { id: params.id },
        data: updateData,
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

      return NextResponse.json(updatedWorkshop);
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Update workshop error:', error);
    return NextResponse.json(
      { error: 'Failed to update workshop' },
      { status: 500 }
    );
  }
}

// DELETE /api/workshops/[id] - Workshop sil (sadece eğitmen)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const workshop = await prisma.workshop.findUnique({
      where: { id: params.id },
    });

    if (!workshop) {
      return NextResponse.json(
        { error: 'Workshop not found' },
        { status: 404 }
      );
    }

    if (workshop.instructorId !== currentUser?.id) {
      return NextResponse.json(
        { error: 'Only the instructor can delete this workshop' },
        { status: 403 }
      );
    }

    await prisma.workshop.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Workshop deleted successfully' });
  } catch (error) {
    console.error('Delete workshop error:', error);
    return NextResponse.json(
      { error: 'Failed to delete workshop' },
      { status: 500 }
    );
  }
}
