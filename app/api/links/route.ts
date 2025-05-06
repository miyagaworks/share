export const dynamic = "force-dynamic";
// app/api/links/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/* eslint-disable @typescript-eslint/no-unused-vars */
export async function GET(req: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "認証されていません" },
                { status: 401 }
            );
        }

        // SNSリンクとカスタムリンクを取得
        const snsLinks = await prisma.snsLink.findMany({
            where: { userId: session.user.id },
            orderBy: { displayOrder: "asc" },
        });

        const customLinks = await prisma.customLink.findMany({
            where: { userId: session.user.id },
            orderBy: { displayOrder: "asc" },
        });

        return NextResponse.json({
            success: true,
            snsLinks,
            customLinks,
        });
    } catch (error) {
        console.error("リンク取得エラー:", error);
        return NextResponse.json(
            { error: "リンク情報の取得に失敗しました" },
            { status: 500 }
        );
    }
}