import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { role, danceStyles, gender, phone, experience, bio } = body;

    // Email'i Clerk'ten al
    const email = clerkUser.emailAddresses[0]?.emailAddress;
    const name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || email?.split('@')[0] || 'User';

    // Kullanıcı zaten var mı kontrol et
    let user = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id }
    });

    if (user) {
      // Profil güncelleme
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          role,
          danceStyles: danceStyles || [],
          gender,
          phone,
          experience: experience ? parseInt(experience) : null,
          bio,
          isProfileComplete: true,
          // INSTRUCTOR ve REFEREE için approval bekletme
          isApproved: role === 'INSTRUCTOR' || role === 'REFEREE' ? false : true,
        }
      });
    } else {
      // Yeni kullanıcı oluştur
      user = await prisma.user.create({
        data: {
          clerkId: clerkUser.id,
          email: email!,
          name,
          password: await bcrypt.hash(Math.random().toString(36), 10), // Random password
          role,
          avatar: clerkUser.imageUrl || null,
          danceStyles: danceStyles || [],
          gender,
          phone,
          experience: experience ? parseInt(experience) : null,
          bio,
          isProfileComplete: true,
          isApproved: role === 'INSTRUCTOR' || role === 'REFEREE' ? false : true,
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          isProfileComplete: user.isProfileComplete,
          isApproved: user.isApproved,
        }
      }
    });
  } catch (error: any) {
    console.error('Profile completion error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Profile completion failed' },
      { status: 500 }
    );
  }
}
