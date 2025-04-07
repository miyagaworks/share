import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json(
                { message: "メールアドレスが必要です" },
                { status: 400 }
            );
        }

        // ユーザーの存在確認
        const user = await prisma.user.findUnique({
            where: { email }
        });

        // セキュリティ上の理由から、ユーザーが見つからなくても同じレスポンスを返す
        if (!user) {
            return NextResponse.json(
                { message: "パスワードリセット用のリンクをメールで送信しました" },
                { status: 200 }
            );
        }

        // リセットトークンの生成
        const resetToken = randomUUID();
        const expires = new Date(Date.now() + 3600 * 1000); // 1時間後

        // 既存のリセットトークンがあれば削除
        await prisma.passwordResetToken.deleteMany({
            where: { userId: user.id }
        });

        // 新しいリセットトークンを保存
        await prisma.passwordResetToken.create({
            data: {
                userId: user.id,
                token: resetToken,
                expires
            }
        });

        // リセットリンクをメールで送信
        const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password?token=${resetToken}`;

        try {
            // メール送信ヘルパー関数を呼び出す
            await sendPasswordResetEmail(user.email, user.name || "ユーザー", resetLink);
        } catch (emailError) {
            console.error("メール送信エラー:", emailError);
            // メール送信エラーでも成功レスポンスを返す（セキュリティ上の理由）
        }

        return NextResponse.json(
            { message: "パスワードリセット用のリンクをメールで送信しました" },
            { status: 200 }
        );
    } catch (error) {
        console.error("パスワードリセットエラー:", error);
        return NextResponse.json(
            { message: "処理中にエラーが発生しました" },
            { status: 500 }
        );
    }
}