// actions/sns.ts
"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
// import { SnslinkSchema, CustomLinkSchema } from "@/schemas/auth";
import { SNS_PLATFORMS } from "@/types/sns";

// SNSリンク追加
export async function addSnsLink(data: {
    platform: string;
    username?: string;
    url: string;
}) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return { error: "認証されていません" };
        }

        // データの検証
        const validatedFields = z.object({
            platform: z.enum(SNS_PLATFORMS),
            username: z.string().optional(),
            url: z.string().url({ message: "有効なURLを入力してください" }),
        }).safeParse(data);

        if (!validatedFields.success) {
            return { error: "入力データが無効です" };
        }

        // プラットフォームが既に存在するか確認
        const existingLink = await prisma.snsLink.findFirst({
            where: {
                userId: session.user.id,
                platform: data.platform,
            },
        });

        if (existingLink) {
            return { error: "このプラットフォームは既に追加されています" };
        }

        // 現在のリンク数を取得して表示順を決定
        const currentLinks = await prisma.snsLink.findMany({
            where: { userId: session.user.id },
        });

        const displayOrder = currentLinks.length + 1;

        // SNSリンクを追加
        const newLink = await prisma.snsLink.create({
            data: {
                userId: session.user.id,
                platform: data.platform,
                username: data.username,
                url: data.url,
                displayOrder,
            },
        });

        // キャッシュを更新
        revalidatePath("/dashboard/links");
        revalidatePath("/dashboard");

        return { success: true, link: newLink };
    } catch (error) {
        console.error("SNSリンク追加エラー:", error);
        return { error: "SNSリンクの追加に失敗しました" };
    }
}

// SNSリンク削除
export async function deleteSnsLink(id: string) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return { error: "認証されていません" };
        }

        // リンクが存在するか確認
        const link = await prisma.snsLink.findFirst({
            where: {
                id,
                userId: session.user.id,
            },
        });

        if (!link) {
            return { error: "リンクが見つかりません" };
        }

        // リンクを削除
        await prisma.snsLink.delete({
            where: { id },
        });

        // 残りのリンクの表示順を再調整
        const remainingLinks = await prisma.snsLink.findMany({
            where: { userId: session.user.id },
            orderBy: { displayOrder: "asc" },
        });

        // 表示順を更新
        for (let i = 0; i < remainingLinks.length; i++) {
            await prisma.snsLink.update({
                where: { id: remainingLinks[i].id },
                data: { displayOrder: i + 1 },
            });
        }

        // キャッシュを更新
        revalidatePath("/dashboard/links");
        revalidatePath("/dashboard");

        return { success: true };
    } catch (error) {
        console.error("SNSリンク削除エラー:", error);
        return { error: "SNSリンクの削除に失敗しました" };
    }
}

// SNSリンクの表示順更新
export async function updateSnsLinkOrder(linkIds: string[]) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return { error: "認証されていません" };
        }

        // 各リンクのIDを検証
        const links = await prisma.snsLink.findMany({
            where: {
                id: { in: linkIds },
                userId: session.user.id,
            },
        });

        if (links.length !== linkIds.length) {
            return { error: "無効なリンクIDが含まれています" };
        }

        // トランザクションで一括更新
        await prisma.$transaction(
            linkIds.map((id, index) =>
                prisma.snsLink.update({
                    where: { id },
                    data: { displayOrder: index + 1 },
                })
            )
        );

        // キャッシュを更新
        revalidatePath("/dashboard/links");
        revalidatePath("/dashboard");

        return { success: true };
    } catch (error) {
        console.error("SNSリンク順序更新エラー:", error);
        return { error: "SNSリンクの順序更新に失敗しました" };
    }
}

// SNSリンク更新
export async function updateSnsLink(id: string, data: {
    username?: string;
    url: string;
}) {
    try {
        const response = await fetch(`/api/links/sns/${id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            return { error: errorData.error || "SNSリンクの更新に失敗しました" };
        }

        return { success: true };
    } catch (error) {
        console.error("SNSリンク更新エラー:", error);
        return { error: "SNSリンクの更新に失敗しました" };
    }
}

// カスタムリンク追加
export async function addCustomLink(data: {
    name: string;
    url: string;
}) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return { error: "認証されていません" };
        }

        // データの検証
        const validatedFields = z.object({
            name: z.string().min(1, { message: "名前を入力してください" }),
            url: z.string().url({ message: "有効なURLを入力してください" }),
        }).safeParse(data);

        if (!validatedFields.success) {
            return { error: "入力データが無効です" };
        }

        // 現在のリンク数を取得して表示順を決定
        const currentLinks = await prisma.customLink.findMany({
            where: { userId: session.user.id },
        });

        const displayOrder = currentLinks.length + 1;

        // カスタムリンクを追加
        const newLink = await prisma.customLink.create({
            data: {
                userId: session.user.id,
                name: data.name,
                url: data.url,
                displayOrder,
            },
        });

        // キャッシュを更新
        revalidatePath("/dashboard/links");
        revalidatePath("/dashboard");

        return { success: true, link: newLink };
    } catch (error) {
        console.error("カスタムリンク追加エラー:", error);
        return { error: "カスタムリンクの追加に失敗しました" };
    }
}

// カスタムリンク削除
export async function deleteCustomLink(id: string) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return { error: "認証されていません" };
        }

        // リンクが存在するか確認
        const link = await prisma.customLink.findFirst({
            where: {
                id,
                userId: session.user.id,
            },
        });

        if (!link) {
            return { error: "リンクが見つかりません" };
        }

        // リンクを削除
        await prisma.customLink.delete({
            where: { id },
        });

        // 残りのリンクの表示順を再調整
        const remainingLinks = await prisma.customLink.findMany({
            where: { userId: session.user.id },
            orderBy: { displayOrder: "asc" },
        });

        // 表示順を更新
        for (let i = 0; i < remainingLinks.length; i++) {
            await prisma.customLink.update({
                where: { id: remainingLinks[i].id },
                data: { displayOrder: i + 1 },
            });
        }

        // キャッシュを更新
        revalidatePath("/dashboard/links");
        revalidatePath("/dashboard");

        return { success: true };
    } catch (error) {
        console.error("カスタムリンク削除エラー:", error);
        return { error: "カスタムリンクの削除に失敗しました" };
    }
}

// カスタムリンクの表示順更新
export async function updateCustomLinkOrder(linkIds: string[]) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return { error: "認証されていません" };
        }

        // 各リンクのIDを検証
        const links = await prisma.customLink.findMany({
            where: {
                id: { in: linkIds },
                userId: session.user.id,
            },
        });

        if (links.length !== linkIds.length) {
            return { error: "無効なリンクIDが含まれています" };
        }

        // トランザクションで一括更新
        await prisma.$transaction(
            linkIds.map((id, index) =>
                prisma.customLink.update({
                    where: { id },
                    data: { displayOrder: index + 1 },
                })
            )
        );

        // キャッシュを更新
        revalidatePath("/dashboard/links");
        revalidatePath("/dashboard");

        return { success: true };
    } catch (error) {
        console.error("カスタムリンク順序更新エラー:", error);
        return { error: "カスタムリンクの順序更新に失敗しました" };
    }
}

// カスタムリンク更新
export async function updateCustomLink(id: string, data: {
    name: string;
    url: string;
}) {
    try {
        const response = await fetch(`/api/links/custom/${id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            return { error: errorData.error || "カスタムリンクの更新に失敗しました" };
        }

        return { success: true };
    } catch (error) {
        console.error("カスタムリンク更新エラー:", error);
        return { error: "カスタムリンクの更新に失敗しました" };
    }
}