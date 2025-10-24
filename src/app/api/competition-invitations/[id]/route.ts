import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Daveti yanıtla (kabul et/reddet)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'Token gerekli' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    const body = await request.json();
    const { action } = body; // 'accept' veya 'reject'

    if (!action || (action !== 'accept' && action !== 'reject')) {
      return NextResponse.json({ error: 'Geçerli bir aksiyon gerekli (accept/reject)' }, { status: 400 });
    }

    // Daveti kontrol et
    const invitation = await prisma.competitionInvitation.findUnique({
      where: { id: params.id },
      include: {
        team: {
          include: {
            competition: true,
            leader: {
              select: {
                id: true,
                name: true
              }
            },
            members: true
          }
        }
      }
    });

    if (!invitation) {
      return NextResponse.json({ error: 'Davet bulunamadı' }, { status: 404 });
    }

    // Davet sahibi kontrolü
    if (invitation.receiverId !== decoded.userId) {
      return NextResponse.json({ error: 'Bu davet size ait değil' }, { status: 403 });
    }

    // Davet durumu kontrolü
    if (invitation.status !== 'PENDING') {
      return NextResponse.json({ error: 'Bu davet zaten yanıtlandı' }, { status: 400 });
    }

    if (action === 'accept') {
      // Kabul et - Takıma üye ekle
      
      // Maksimum üye sayısı kontrolü
      if (invitation.team.members.length >= invitation.team.competition.maxTeamMembers) {
        return NextResponse.json({ error: 'Takım dolu' }, { status: 400 });
      }

      // Transaction ile hem daveti güncelle hem üye ekle
      const result = await prisma.$transaction([
        // Daveti güncelle
        prisma.competitionInvitation.update({
          where: { id: params.id },
          data: {
            status: 'ACCEPTED',
            respondedAt: new Date()
          }
        }),
        // Takıma üye ekle
        prisma.competitionTeamMember.create({
          data: {
            teamId: invitation.teamId,
            userId: decoded.userId,
            role: 'MEMBER'
          }
        }),
        // Takım liderine bildirim gönder
        prisma.notification.create({
          data: {
            userId: invitation.team.leaderId,
            type: 'INVITATION_ACCEPTED',
            title: '✅ Davet Kabul Edildi',
            message: `Bir dansçı ${invitation.team.name} takımına katıldı`
          }
        })
      ]);

      return NextResponse.json({ 
        success: true, 
        invitation: result[0],
        member: result[1],
        message: 'Takıma başarıyla katıldınız' 
      });
    } else {
      // Reddet
      const updatedInvitation = await prisma.competitionInvitation.update({
        where: { id: params.id },
        data: {
          status: 'REJECTED',
          respondedAt: new Date()
        }
      });

      // Takım liderine bildirim gönder
      await prisma.notification.create({
        data: {
          userId: invitation.team.leaderId,
          type: 'INVITATION_REJECTED',
          title: '❌ Davet Reddedildi',
          message: `Bir dansçı ${invitation.team.name} takımına katılmayı reddetti`
        }
      });

      return NextResponse.json({ 
        success: true, 
        invitation: updatedInvitation,
        message: 'Davet reddedildi' 
      });
    }
  } catch (error: any) {
    console.error('Respond invitation error:', error);
    return NextResponse.json(
      { error: error.message || 'Davet yanıtlanamadı' },
      { status: 500 }
    );
  }
}
