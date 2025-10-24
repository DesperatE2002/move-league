import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Şarkı açıkla (sadece ADMIN)
export async function POST(
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
      return NextResponse.json({ error: 'Sadece adminler şarkı açıklayabilir' }, { status: 403 });
    }

    const body = await request.json();
    const { songTitle, songArtist, songUrl } = body;

    if (!songTitle || !songUrl) {
      return NextResponse.json({ error: 'Şarkı adı ve URL gerekli' }, { status: 400 });
    }

    // Yarışmayı kontrol et
    const competition = await prisma.competition.findUnique({
      where: { id: params.id }
    });

    if (!competition) {
      return NextResponse.json({ error: 'Yarışma bulunamadı' }, { status: 404 });
    }

    if (competition.songRevealed) {
      return NextResponse.json({ error: 'Şarkı zaten açıklandı' }, { status: 400 });
    }

    // Şarkıyı güncelle
    const updatedCompetition = await prisma.competition.update({
      where: { id: params.id },
      data: {
        songTitle,
        songArtist,
        songUrl,
        songRevealed: true,
        status: 'SONG_REVEALED'
      }
    });

    // Tüm takım liderlerine bildirim gönder
    const teams = await prisma.competitionTeam.findMany({
      where: { competitionId: params.id },
      include: {
        leader: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    for (const team of teams) {
      await prisma.notification.create({
        data: {
          userId: team.leaderId,
          type: 'SONG_REVEALED',
          title: '🎵 Şarkı Açıklandı',
          message: `${competition.name} yarışması için şarkı açıklandı: ${songTitle}${songArtist ? ' - ' + songArtist : ''}`
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      competition: updatedCompetition,
      message: 'Şarkı açıklandı ve takım liderlerine bildirim gönderildi' 
    });
  } catch (error: any) {
    console.error('Reveal song error:', error);
    return NextResponse.json(
      { error: error.message || 'Şarkı açıklanamadı' },
      { status: 500 }
    );
  }
}
