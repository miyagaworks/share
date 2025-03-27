import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/utils";

export const getUserByEmail = async (email: string) => {
    try {
        const user = await prisma.user.findUnique({
            where: { email }
        });

        return user;
    } catch {
        return null;
    }
};

export const getUserById = async (id: string) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id }
        });

        return user;
    } catch {
        return null;
    }
};

export const createProfile = async (userId: string) => {
    try {
        // プロフィールがすでに存在するか確認
        const existingProfile = await prisma.profile.findUnique({
            where: { userId }
        });

        if (existingProfile) {
            return existingProfile;
        }

        // 一意のスラグを生成
        let slug = generateSlug();
        let slugExists = true;

        // スラグがすでに存在する場合は新しいスラグを生成
        while (slugExists) {
            const existingSlug = await prisma.profile.findUnique({
                where: { slug }
            });

            if (!existingSlug) {
                slugExists = false;
            } else {
                slug = generateSlug();
            }
        }

        // プロフィールを作成
        const profile = await prisma.profile.create({
            data: {
                userId,
                slug,
                isPublic: true
            }
        });

        return profile;
    } catch (error) {
        console.error("プロフィール作成エラー:", error);
        return null;
    }
};

export const updateProfile = async (
    userId: string,
    data: {
        name?: string;
        nameEn?: string;
        bio?: string;
        image?: string;
        mainColor?: string;
        phone?: string;
        company?: string;
    }
) => {
    try {
        // ユーザー情報を更新
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data
        });

        // プロフィールがまだない場合は作成
        const profile = await createProfile(userId);

        return {
            user: updatedUser,
            profile
        };
    } catch (error) {
        console.error("プロフィール更新エラー:", error);
        return null;
    }
};