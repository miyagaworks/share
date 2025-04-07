// app/api/vcard/[userId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: NextRequest,
    { params }: { params: { userId: string } }
) {
    try {
        const userId = params.userId;

        // ユーザー情報の取得
        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            console.error("User not found:", userId);
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // vCardフォーマットの生成
        const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

        // 名前を適切に処理
        let lastName = "", firstName = "";
        if (user.nameEn) {
            const nameParts = user.nameEn.split(" ");
            if (nameParts.length > 1) {
                lastName = nameParts.pop() || "";
                firstName = nameParts.join(" ");
            } else {
                firstName = user.nameEn;
            }
        }

        const vcard = [
            "BEGIN:VCARD",
            "VERSION:3.0",
            `FN:${user.name || ""}`,
            `N:${lastName};${firstName};;;`,
            `REV:${now}`
        ];

        // オプション情報の追加
        if (user.phone) {
            vcard.push(`TEL;TYPE=CELL:${user.phone}`);
        }

        if (user.email) {
            vcard.push(`EMAIL;TYPE=INTERNET:${user.email}`);
        }

        if (user.company) {
            vcard.push(`ORG:${user.company}`);
        }

        if (user.image) {
            // 画像URLを含める
            vcard.push(`PHOTO;VALUE=URI:${user.image}`);
        }

        try {
            // SNSリンクの取得と追加
            const snsLinks = await prisma.snsLink.findMany({
                where: { userId },
                orderBy: { displayOrder: "asc" },
            });

            snsLinks.forEach(link => {
                vcard.push(`URL;TYPE=${link.platform.toUpperCase()}:${link.url}`);
            });

            // カスタムリンクの取得と追加
            const customLinks = await prisma.customLink.findMany({
                where: { userId },
                orderBy: { displayOrder: "asc" },
            });

            customLinks.forEach(link => {
                vcard.push(`URL;TYPE=WORK:${link.url}`);
            });
        } catch (error) {
            console.error("Error fetching links:", error);
            // リンク情報の取得に失敗しても処理を継続
        }

        // vCardの終了
        vcard.push("END:VCARD");

        // 標準的なvCardの行区切りはCRLF
        const vcardContent = vcard.join("\r\n");

        // vCardデータを返す
        return new NextResponse(vcardContent, {
            headers: {
                "Content-Type": "text/vcard",
                "Content-Disposition": `attachment; filename="${user.name || "contact"}.vcf"`,
            },
        });
    } catch (error) {
        console.error("vCard generation error:", error);
        return NextResponse.json(
            { error: "Failed to generate vCard" },
            { status: 500 }
        );
    }
}