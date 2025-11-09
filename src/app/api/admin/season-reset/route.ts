import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth";

// POST /api/admin/season-reset - Reset season (Admin only)
export async function POST(request: Request) {
  try {
    const user = await verifyAuth(request);
    
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Bu işlem için admin yetkisi gerekli" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { confirmationText } = body;

    // Safety check - user must type "RESET" to confirm
    if (confirmationText !== "RESET") {
      return NextResponse.json(
        { success: false, error: "Lütfen doğrulama için 'RESET' yazın" },
        { status: 400 }
      );
    }

    // Start transaction to reset all league data
    const result = await prisma.$transaction(async (tx) => {
      // Archive current season stats (optional - for historical data)
      const currentDate = new Date();
      const seasonName = `Sezon ${currentDate.getFullYear()}-${currentDate.getMonth() + 1}`;
      
      // Get all users with their current ratings for archive
      const allUsers = await tx.user.findMany({
        select: { id: true, username: true, rating: true, wins: true, losses: true }
      });

      // Reset all user stats to default
      await tx.user.updateMany({
        data: {
          rating: 1000,
          wins: 0,
          losses: 0
        }
      });

      // Delete all battle requests (or archive them)
      const deletedBattles = await tx.battleRequest.deleteMany({});

      // Delete all notifications
      const deletedNotifications = await tx.notification.deleteMany({});

      // Reset competition-related data if needed
      // await tx.competition.deleteMany({});
      // await tx.competitionTeam.deleteMany({});
      // await tx.competitionInvitation.deleteMany({});

      return {
        resetUsers: allUsers.length,
        deletedBattles: deletedBattles.count,
        deletedNotifications: deletedNotifications.count,
        seasonName,
        archivedUsers: allUsers
      };
    });

    // Create notification for all users about season reset
    const allUserIds = await prisma.user.findMany({
      select: { id: true }
    });

    await prisma.notification.createMany({
      data: allUserIds.map(u => ({
        userId: u.id,
        title: "🎉 Yeni Sezon Başladı!",
        message: "Lig sıfırlandı! Herkes 1000 rating ile başlıyor. Hadi yeni şampiyonu belirleyelim!",
        type: "SYSTEM"
      }))
    });

    return NextResponse.json({
      success: true,
      message: "Sezon başarıyla sıfırlandı!",
      data: result
    });

  } catch (error: any) {
    console.error("Season reset error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Sezon sıfırlama hatası" },
      { status: 500 }
    );
  }
}
