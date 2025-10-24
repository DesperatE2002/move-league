import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Davet gönder
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

    // Takımı kontrol et
    const team = await prisma.competitionTeam.findUnique({
      where: { id: params.id },
      include: {
        competition: true,
        leader: {
          select: {
            id: true,
            name: true
          }
        },
        members: true,
        invitations: {
          where: {
            status: 'PENDING'
          }
        }
      }
    });

    if (!team) {
      return NextResponse.json({ error: 'Takım bulunamadı' }, { status: 404 });
    }

    // Takım lideri kontrolü
    if (team.leaderId !== decoded.userId) {
      return NextResponse.json({ error: 'Sadece takım lideri davet gönderebilir' }, { status: 403 });
    }

    const body = await request.json();
    const { dancerId, message } = body;

    if (!dancerId) {
      return NextResponse.json({ error: 'Dansçı ID gerekli' }, { status: 400 });
    }

    // Dansçıyı kontrol et
    const dancer = await prisma.user.findUnique({
      where: { id: dancerId },
      select: {
        id: true,
        name: true,
        role: true
      }
    });

    if (!dancer || dancer.role !== 'DANCER') {
      return NextResponse.json({ error: 'Geçerli bir dansçı bulunamadı' }, { status: 404 });
    }

    // Zaten üye mi kontrol et
    const existingMember = await prisma.competitionTeamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: params.id,
          userId: dancerId
        }
      }
    });

    if (existingMember) {
      return NextResponse.json({ error: 'Bu dansçı zaten takımda' }, { status: 400 });
    }

    // Bekleyen davet var mı kontrol et
    const existingInvitation = await prisma.competitionInvitation.findFirst({
      where: {
        teamId: params.id,
        receiverId: dancerId,
        status: 'PENDING'
      }
    });

    if (existingInvitation) {
      return NextResponse.json({ error: 'Bu dansçıya zaten davet gönderildi' }, { status: 400 });
    }

    // Maksimum üye sayısı kontrolü (davetler + mevcut üyeler)
    const totalMembers = team.members.length + team.invitations.length;
    if (totalMembers >= team.competition.maxTeamMembers) {
      return NextResponse.json({ error: 'Maksimum takım üye sayısına ulaşıldı' }, { status: 400 });
    }

    // Davet oluştur
    const invitation = await prisma.competitionInvitation.create({
      data: {
        teamId: params.id,
        senderId: decoded.userId,
        receiverId: dancerId,
        message
      },
      include: {
        team: {
          include: {
            competition: {
              select: {
                name: true,
                eventDate: true,
                location: true
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
      }
    });

    // Bildirim oluştur
    await prisma.notification.create({
      data: {
        userId: dancerId,
        type: 'COMPETITION_INVITATION',
        title: '💃 Takım Daveti',
        message: `${team.leader.name} sizi ${team.name} takımına davet etti (${team.competition.name})`
      }
    });

    return NextResponse.json({ 
      success: true, 
      invitation,
      message: 'Davet başarıyla gönderildi' 
    });
  } catch (error: any) {
    console.error('Send invitation error:', error);
    return NextResponse.json(
      { error: error.message || 'Davet gönderilemedi' },
      { status: 500 }
    );
  }
}
