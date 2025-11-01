import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ success: false, message: "Yetkisiz" }, { status: 401 });
    }

    const userId = Buffer.from(token, "base64").toString("utf-8").split(":")[0];
    const adminUser = await prisma.user.findFirst({
      where: { id: userId, role: "ADMIN" }
    });

    if (!adminUser) {
      return NextResponse.json({ success: false, message: "Admin gerekli" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } }
      ];
    }
    if (role && role !== "ALL") {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
          bio: true,
          rating: true,
          experience: true,
          danceStyles: true,
          badges: true,
          createdAt: true,
          _count: {
            select: {
              initiatedBattles: true,
              challengedBattles: true,
              wonBattles: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: { 
        users, 
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ success: false, message: "Yetkisiz" }, { status: 401 });
    }

    const userId = Buffer.from(token, "base64").toString("utf-8").split(":")[0];
    const adminUser = await prisma.user.findFirst({
      where: { id: userId, role: "ADMIN" }
    });

    if (!adminUser) {
      return NextResponse.json({ success: false, message: "Admin gerekli" }, { status: 403 });
    }

    const body = await request.json();
    const { action, userId: targetUserId, role, rating, bio, danceStyles, experienceYears, badge, title, message } = body;

    if (!targetUserId || !action) {
      return NextResponse.json({ success: false, message: "Eksik parametreler" }, { status: 400 });
    }

    let result;

    switch (action) {
      case "UPDATE_ROLE":
        result = await prisma.user.update({
          where: { id: targetUserId },
          data: { role }
        });
        break;

      case "UPDATE_RATING":
        result = await prisma.user.update({
          where: { id: targetUserId },
          data: { rating: parseInt(rating) }
        });
        break;

      case "UPDATE_PROFILE":
        result = await prisma.user.update({
          where: { id: targetUserId },
          data: {
            bio,
            danceStyles,
            experience: experienceYears ? parseInt(experienceYears) : null
          }
        });
        break;

      case "ADD_BADGE":
        const user = await prisma.user.findUnique({
          where: { id: targetUserId },
          select: { badges: true }
        });
        const currentBadges = user?.badges || [];
        if (!currentBadges.includes(badge)) {
          result = await prisma.user.update({
            where: { id: targetUserId },
            data: { badges: [...currentBadges, badge] }
          });
        }
        break;

      case "REMOVE_BADGE":
        const userWithBadge = await prisma.user.findUnique({
          where: { id: targetUserId },
          select: { badges: true }
        });
        const filteredBadges = (userWithBadge?.badges || []).filter((b: string) => b !== badge);
        result = await prisma.user.update({
          where: { id: targetUserId },
          data: { badges: filteredBadges }
        });
        break;

      case "SEND_NOTIFICATION":
        await prisma.notification.create({
          data: {
            userId: targetUserId,
            type: "BATTLE_REQUEST",
            title: title || "Admin Mesajı",
            message,
            isRead: false
          }
        });
        result = { success: true };
        break;

      case "DELETE_USER":
        result = await prisma.user.update({
          where: { id: targetUserId },
          data: { 
            email: `deleted_${targetUserId}_${Date.now()}@deleted.com`,
            name: "Silinen Kullanıcı"
          }
        });
        break;

      default:
        return NextResponse.json({ success: false, message: "Geçersiz işlem" }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result, message: "İşlem başarılı" });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ success: false, message: "Yetkisiz" }, { status: 401 });
    }

    const userId = Buffer.from(token, "base64").toString("utf-8").split(":")[0];
    const adminUser = await prisma.user.findFirst({
      where: { id: userId, role: "ADMIN" }
    });

    if (!adminUser) {
      return NextResponse.json({ success: false, message: "Admin gerekli" }, { status: 403 });
    }

    const body = await request.json();
    const { userIds, action, title, message, badge } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ success: false, message: "Kullanıcı ID listesi gerekli" }, { status: 400 });
    }

    let result;

    switch (action) {
      case "BULK_NOTIFICATION":
        const notifications = userIds.map((uid: string) => ({
          userId: uid,
          type: "BATTLE_REQUEST" as any,
          title: title || "Admin Duyurusu",
          message,
          isRead: false
        }));
        
        result = await prisma.notification.createMany({
          data: notifications
        });
        break;

      case "BULK_ADD_BADGE":
        for (const uid of userIds) {
          const user = await prisma.user.findUnique({
            where: { id: uid },
            select: { badges: true }
          });
          const currentBadges = user?.badges || [];
          if (!currentBadges.includes(badge)) {
            await prisma.user.update({
              where: { id: uid },
              data: { badges: [...currentBadges, badge] }
            });
          }
        }
        result = { count: userIds.length };
        break;

      default:
        return NextResponse.json({ success: false, message: "Geçersiz toplu işlem" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: `${userIds.length} kullanıcı için işlem başarılı`
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}