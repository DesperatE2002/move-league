import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ============ GET: Liste tüm mevcut rozetleri ============
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Yetkilendirme başlığı gerekli" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let userId: string;

    try {
      const decoded = JSON.parse(
        Buffer.from(token, "base64").toString("utf-8")
      );
      userId = decoded.userId;

      if (!userId || !decoded.exp || decoded.exp < Date.now()) {
        throw new Error("Invalid or expired token");
      }
    } catch (error) {
      return NextResponse.json(
        { success: false, error: "Geçersiz veya süresi dolmuş token" },
        { status: 403 }
      );
    }

    // Admin kontrolü
    const adminUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!adminUser || adminUser.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Bu işlem için yetkiniz yok" },
        { status: 403 }
      );
    }

    // Tüm kullanıcıların rozetlerini topla
    const users = await prisma.user.findMany({
      select: { badges: true },
    });

    const badgeSet = new Set<string>();
    users.forEach((user) => {
      user.badges.forEach((badge) => {
        if (badge) badgeSet.add(badge);
      });
    });

    const badges = Array.from(badgeSet).map((badge, index) => ({
      id: index + 1,
      name: badge,
      usageCount: users.filter((u) => u.badges.includes(badge)).length,
    }));

    return NextResponse.json({
      success: true,
      data: { badges },
    });
  } catch (error) {
    console.error("❌ Rozet listesi hatası:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Bilinmeyen hata",
      },
      { status: 500 }
    );
  }
}

// ============ POST: Yeni rozet oluştur ============
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Yetkilendirme başlığı gerekli" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let userId: string;

    try {
      const decoded = JSON.parse(
        Buffer.from(token, "base64").toString("utf-8")
      );
      userId = decoded.userId;

      if (!userId || !decoded.exp || decoded.exp < Date.now()) {
        throw new Error("Invalid or expired token");
      }
    } catch (error) {
      return NextResponse.json(
        { success: false, error: "Geçersiz veya süresi dolmuş token" },
        { status: 403 }
      );
    }

    // Admin kontrolü
    const adminUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!adminUser || adminUser.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Bu işlem için yetkiniz yok" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { badgeName } = body;

    if (!badgeName || typeof badgeName !== "string") {
      return NextResponse.json(
        { success: false, error: "Rozet adı gerekli" },
        { status: 400 }
      );
    }

    // Rozet zaten var mı kontrol et
    const existingUser = await prisma.user.findFirst({
      where: {
        badges: {
          has: badgeName,
        },
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Bu rozet zaten mevcut" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        badge: {
          name: badgeName,
          usageCount: 0,
        },
      },
      message: `${badgeName} rozeti oluşturuldu`,
    });
  } catch (error) {
    console.error("❌ Rozet oluşturma hatası:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Bilinmeyen hata",
      },
      { status: 500 }
    );
  }
}

// ============ DELETE: Rozet sil (tüm kullanıcılardan) ============
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Yetkilendirme başlığı gerekli" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let userId: string;

    try {
      const decoded = JSON.parse(
        Buffer.from(token, "base64").toString("utf-8")
      );
      userId = decoded.userId;

      if (!userId || !decoded.exp || decoded.exp < Date.now()) {
        throw new Error("Invalid or expired token");
      }
    } catch (error) {
      return NextResponse.json(
        { success: false, error: "Geçersiz veya süresi dolmuş token" },
        { status: 403 }
      );
    }

    // Admin kontrolü
    const adminUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!adminUser || adminUser.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Bu işlem için yetkiniz yok" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { badgeName } = body;

    if (!badgeName || typeof badgeName !== "string") {
      return NextResponse.json(
        { success: false, error: "Rozet adı gerekli" },
        { status: 400 }
      );
    }

    // Bu rozete sahip tüm kullanıcıları bul ve rozeti kaldır
    const usersWithBadge = await prisma.user.findMany({
      where: {
        badges: {
          has: badgeName,
        },
      },
      select: { id: true, badges: true },
    });

    // Her kullanıcıdan rozeti kaldır
    for (const user of usersWithBadge) {
      const updatedBadges = user.badges.filter((b) => b !== badgeName);
      await prisma.user.update({
        where: { id: user.id },
        data: { badges: updatedBadges },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        deletedBadge: badgeName,
        affectedUsers: usersWithBadge.length,
      },
      message: `${badgeName} rozeti ${usersWithBadge.length} kullanıcıdan kaldırıldı`,
    });
  } catch (error) {
    console.error("❌ Rozet silme hatası:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Bilinmeyen hata",
      },
      { status: 500 }
    );
  }
}
