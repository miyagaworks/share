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
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // vCardフォーマットの生成
        const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

        const vcard = [
            "BEGIN:VCARD",
            "VERSION:3.0",
            `FN:${user.name || ""}`,
            `N:${user.nameEn?.split(" ").pop() || ""};${user.nameEn?.split(" ")[0] || ""};;;`,
            `REV:${now}`,
        ];

        // オプション情報の追加
        if (user.phone) {
            vcard.push(`TEL;TYPE=CELL:${user.phone}`);
        }

        if (user.email) {
            vcard.push(`EMAIL:${user.email}`);
        }

        if (user.company) {
            vcard.push(`ORG:${user.company}`);
        }

        if (user.image) {
            // 画像URLではなく、埋め込み画像として追加する場合は以下のようなコード
            // 注: 画像のサイズによってはvCardが大きくなりすぎる可能性がある
            /* 
            try {
              const imageResponse = await fetch(user.image);
              const imageBuffer = await imageResponse.arrayBuffer();
              const base64Image = Buffer.from(imageBuffer).toString("base64");
              
              const imageType = user.image.split(".").pop()?.toLowerCase() || "jpeg";
              vcard.push(`PHOTO;ENCODING=b;TYPE=${imageType}:${base64Image}`);
            } catch (error) {
              console.error("Failed to fetch profile image:", error);
            }
            */

            // 画像URLを含める
            vcard.push(`PHOTO;VALUE=uri:${user.image}`);
        }

        // SNSリンクの取得と追加
        const snsLinks = await prisma.snsLink.findMany({
            where: { userId },
            orderBy: { displayOrder: "asc" },
        });

        snsLinks.forEach(link => {
            vcard.push(`URL;type=${link.platform}:${link.url}`);
        });

        // カスタムリンクの取得と追加
        const customLinks = await prisma.customLink.findMany({
            where: { userId },
            orderBy: { displayOrder: "asc" },
        });

        customLinks.forEach(link => {
            vcard.push(`URL;type=WORK:${link.url}`);
        });

        // vCardの終了
        vcard.push("END:VCARD");

        // vCardデータを返す
        return new NextResponse(vcard.join("\n"), {
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