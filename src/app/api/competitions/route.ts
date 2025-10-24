import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Yarışmaları listele
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Token gerekli' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    // Query parametreleri
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // UPCOMING, REGISTRATION_OPEN, etc.
    const includeInactive = searchParams.get('includeInactive') === 'true';

    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (!includeInactive) {
      where.isActive = true;
    }

    const competitions = await prisma.competition.findMany({
      where,
      orderBy: {
        eventDate: 'asc'
      },
      include: {
        teams: {
          include: {
            leader: {
              select: {
                id: true,
                name: true,
                avatar: true
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
                members: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({ success: true, competitions });
  } catch (error: any) {
    console.error('Get competitions error:', error);
    return NextResponse.json(
      { error: error.message || 'Yarışmalar yüklenemedi' },
      { status: 500 }
    );
  }
}

// Yeni yarışma oluştur (sadece ADMIN)
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Token gerekli' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };

    // Admin kontrolü
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Sadece adminler yarışma oluşturabilir' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      eventDate,
      registrationStart,
      registrationEnd,
      songRevealDate,
      location,
      address,
      venue,
      description,
      rules,
      minTeamMembers = 4,
      maxTeamMembers = 8,
      maxTeams,
      prizeFirst,
      prizeSecond,
      prizeThird,
      judgeCount = 3,
      judges = []
    } = body;

    // Validasyonlar
    if (!name || !eventDate || !registrationStart || !registrationEnd || !songRevealDate || !location || !maxTeams) {
      return NextResponse.json({ error: 'Gerekli alanları doldurun' }, { status: 400 });
    }

    // Tarihleri kontrol et
    const eventDateObj = new Date(eventDate);
    const registrationStartObj = new Date(registrationStart);
    const registrationEndObj = new Date(registrationEnd);
    const songRevealDateObj = new Date(songRevealDate);
    const now = new Date();

    if (eventDateObj <= now) {
      return NextResponse.json({ error: 'Etkinlik tarihi gelecekte olmalı' }, { status: 400 });
    }

    if (registrationStartObj >= registrationEndObj) {
      return NextResponse.json({ error: 'Kayıt başlangıç tarihi bitiş tarihinden önce olmalı' }, { status: 400 });
    }

    if (songRevealDateObj >= eventDateObj) {
      return NextResponse.json({ error: 'Şarkı açıklama tarihi etkinlik tarihinden önce olmalı' }, { status: 400 });
    }

    // Durum belirleme
    let status = 'UPCOMING';
    if (now >= registrationStartObj && now <= registrationEndObj) {
      status = 'REGISTRATION_OPEN';
    }

    const competition = await prisma.competition.create({
      data: {
        name,
        eventDate: eventDateObj,
        registrationStart: registrationStartObj,
        registrationEnd: registrationEndObj,
        songRevealDate: songRevealDateObj,
        location,
        address,
        venue,
        description,
        rules,
        minTeamMembers,
        maxTeamMembers,
        maxTeams,
        prizeFirst,
        prizeSecond,
        prizeThird,
        judgeCount,
        judges,
        status
      }
    });

    return NextResponse.json({ 
      success: true, 
      competition,
      message: 'Yarışma başarıyla oluşturuldu' 
    });
  } catch (error: any) {
    console.error('Create competition error:', error);
    return NextResponse.json(
      { error: error.message || 'Yarışma oluşturulamadı' },
      { status: 500 }
    );
  }
}
