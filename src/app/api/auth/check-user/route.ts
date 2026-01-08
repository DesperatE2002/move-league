import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const clerkUser = await currentUser();
    
    if (!clerkUser) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Clerk ID ile kullanıcıyı bul
    let user = await prisma.user.findUnique({
      where: { clerkId: clerkUser.id }
    });

    // İlk kez giriş yapıyorsa (user yoksa)
    if (!user) {
      return NextResponse.json({
        success: true,
        data: {
          user: null,
          isFirstLogin: true,
          clerkUser: {
            email: clerkUser.emailAddresses[0]?.emailAddress,
            name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
            avatar: clerkUser.imageUrl,
          }
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
          avatar: user.avatar,
          isProfileComplete: user.isProfileComplete,
          isApproved: user.isApproved,
          danceStyles: user.danceStyles,
        },
        isFirstLogin: false,
      }
    });
  } catch (error: any) {
    console.error('Check user error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Check user failed' },
      { status: 500 }
    );
  }
}
