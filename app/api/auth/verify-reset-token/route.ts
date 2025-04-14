// app/api/auth/verify-reset-token/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const token = url.searchParams.get("token");

        if (!token) {
            return NextResponse.json(
                { message: "トークンが必要です" },
                { status: 400 }
            );
        }

        // トークンの検証
        const resetToken = await prisma.passwordResetToken.findUnique({
            where: { token },
        });

        // トークンが存在しない、または期限切れの場合
        if (!resetToken || resetToken.expires < new Date()) {
            return NextResponse.json(
                { message: "無効または期限切れのトークンです" },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { message: "有効なトークンです" },
            { status: 200 }
        );
    } catch (error) {
        console.error("トークン検証エラー:", error);
        return NextResponse.json(
            { message: "処理中にエラーが発生しました" },
            { status: 500 }
        );
    }
}