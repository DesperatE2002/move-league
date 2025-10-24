import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Dansçıları listele (Eğitmenler için)
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Token gerekli' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };

    // Sadece eğitmenler ve adminler görebilir
    if (decoded.role !== 'INSTRUCTOR' && decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Erişim reddedildi' }, { status: 403 });
    }

    // Query parametreleri
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const danceStyle = searchParams.get('danceStyle');

    const where: any = {
      role: 'DANCER'
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (danceStyle) {
      where.danceStyles = {
        has: danceStyle
      };
    }

    const dancers = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        danceStyles: true,
        experience: true,
        rating: true,
        bio: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({ success: true, dancers });
  } catch (error: any) {
    console.error('Get dancers error:', error);
    return NextResponse.json(
      { error: error.message || 'Dansçılar yüklenemedi' },
      { status: 500 }
    );
  }
}

// Takım oluştur
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Token gerekli' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };

    // Sadece eğitmenler takım oluşturabilir
    if (decoded.role !== 'INSTRUCTOR') {
      return NextResponse.json({ error: 'Sadece eğitmenler takım oluşturabilir' }, { status: 403 });
    }

    const body = await request.json();
    const { competitionId, name } = body;

    if (!competitionId || !name) {
      return NextResponse.json({ error: 'Yarışma ve takım adı gerekli' }, { status: 400 });
    }

    // Yarışmayı kontrol et
    const competition = await prisma.competition.findUnique({
      where: { id: competitionId },
      include: {
        teams: true
      }
    });

    if (!competition) {
      return NextResponse.json({ error: 'Yarışma bulunamadı' }, { status: 404 });
    }

    // Kayıt dönemi kontrolü
    const now = new Date();
    if (now < competition.registrationStart) {
      return NextResponse.json({ error: 'Kayıt dönemi henüz başlamadı' }, { status: 400 });
    }

    if (now > competition.registrationEnd) {
      return NextResponse.json({ error: 'Kayıt dönemi sona erdi' }, { status: 400 });
    }

    // Maksimum takım sayısı kontrolü
    if (competition.teams.length >= competition.maxTeams) {
      return NextResponse.json({ error: 'Maksimum takım sayısına ulaşıldı' }, { status: 400 });
    }

    // Eğitmenin zaten takımı var mı kontrol et
    const existingTeam = await prisma.competitionTeam.findFirst({
      where: {
        competitionId,
        leaderId: decoded.userId
      }
    });

    if (existingTeam) {
      return NextResponse.json({ error: 'Bu yarışma için zaten bir takımınız var' }, { status: 400 });
    }

    // Takım oluştur
    const team = await prisma.competitionTeam.create({
      data: {
        competitionId,
        name,
        leaderId: decoded.userId
      },
      include: {
        leader: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      team,
      message: 'Takım başarıyla oluşturuldu' 
    });
  } catch (error: any) {
    console.error('Create team error:', error);
    return NextResponse.json(
      { error: error.message || 'Takım oluşturulamadı' },
      { status: 500 }
    );
  }
}
