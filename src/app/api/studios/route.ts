// GET /api/studios
// Stüdyo listesini getir

import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const currentUser = getUserFromRequest(request);
    if (!currentUser) {
      return unauthorizedResponse('Giriş yapmanız gerekiyor');
    }

    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const minCapacity = searchParams.get('minCapacity');
    const maxPrice = searchParams.get('maxPrice');
    const search = searchParams.get('search');

    const where: any = {};

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (minCapacity) {
      where.capacity = { gte: parseInt(minCapacity) };
    }

    if (maxPrice) {
      where.pricePerHour = { lte: parseFloat(maxPrice) };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const studios = await prisma.studio.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return successResponse(studios);
  } catch (error) {
    console.error('Get studios error:', error);
    return errorResponse('Stüdyolar getirilemedi', 500, error);
  }
}

// POST /api/studios
// Yeni stüdyo oluştur (Sadece STUDIO rolü)

export async function POST(request: NextRequest) {
  try {
    const currentUser = getUserFromRequest(request);
    if (!currentUser) {
      return unauthorizedResponse('Giriş yapmanız gerekiyor');
    }

    if (currentUser.role !== 'STUDIO') {
      return errorResponse('Sadece stüdyo hesapları stüdyo oluşturabilir', 403);
    }

    const body = await request.json();
    const { name, description, address, city, capacity, pricePerHour, facilities } = body;

    if (!name || !address || !city || !capacity) {
      return errorResponse('Gerekli alanlar eksik: name, address, city, capacity', 400);
    }

    const studio = await prisma.studio.create({
      data: {
        userId: currentUser.userId,
        name,
        description,
        address,
        city,
        capacity: parseInt(capacity),
        facilities: facilities ? facilities.split(',').map((f: string) => f.trim()) : [],
        pricePerHour: pricePerHour ? parseFloat(pricePerHour) : 0,
        isActive: true,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
    });

    return successResponse(studio, 'Stüdyo başarıyla oluşturuldu', 201);
  } catch (error) {
    console.error('Create studio error:', error);
    return errorResponse('Stüdyo oluşturulamadı', 500, error);
  }
}
