// app/dashboard/subscription/page.tsx
"use client";

import { useEffect, useState } from "react";
import { redirect } from "next/navigation";
import { useSession } from "next-auth/react";
import SubscriptionSettings from "@/components/subscription/SubscriptionSettings";
import SubscriptionStatus from "@/components/subscription/SubscriptionStatus";
import TrialBanner from "@/components/subscription/TrialBanner";
import { Spinner } from "@/components/ui/Spinner";
import { HiCreditCard } from "react-icons/hi";
import { motion } from "framer-motion";

// ユーザーデータの型定義
interface UserData {
    id: string;
    trialEndsAt?: string | null;
    subscriptionStatus?: string | null;
    // 他に必要なフィールドがあれば追加
}

export default function SubscriptionPage() {
    const { data: session } = useSession();
    const [mounted, setMounted] = useState(false);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // ユーザーデータを取得する関数
    const fetchUserData = async (): Promise<UserData | null> => {
        try {
            const response = await fetch('/api/profile');
            if (!response.ok) {
                throw new Error("プロフィール情報の取得に失敗しました");
            }
            const data = await response.json();
            return data.user;
        } catch (error) {
            console.error("データ取得エラー:", error);
            return null;
        }
    };

    const handleUpdate = async () => {
        const data = await fetchUserData();
        setUserData(data);
    };

    useEffect(() => {
        setMounted(true);

        // ユーザーデータの取得
        if (session?.user?.id) {
            const loadUserData = async () => {
                const data = await fetchUserData();
                setUserData(data);
                setIsLoading(false);
            };
            loadUserData();
        } else {
            setIsLoading(false); // セッションがない場合もローディング終了
        }
    }, [session]);

    if (!mounted || isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[300px]">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!session) {
        redirect("/auth/signin");
    }

    // ページアニメーション設定
    const pageVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
    };

    return (
        <div className="w-full" style={{ backgroundColor: 'rgb(249, 250, 251)' }}>
            {/* トライアルバナーをmotion.divの外に配置しつつ、絶対配置で空間を取らないようにする */}
            {userData?.trialEndsAt && (
                <div className="relative">
                    <TrialBanner trialEndDate={userData.trialEndsAt} />
                </div>
            )}

            {/* タイトル部分のトップマージンを固定値にして、バナーの有無に関わらず一定の位置に表示 */}
            <motion.div
                initial="hidden"
                animate="visible"
                variants={pageVariants}
                id="subscription-plans"
            >
                <div className="flex items-center mb-6">
                    <HiCreditCard className="h-8 w-8 text-gray-700 mr-3" />
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">ご利用プラン</h1>
                        <p className="text-muted-foreground">
                            プランの管理、支払い設定、請求履歴の確認ができます
                        </p>
                    </div>
                </div>

                {/* ここにSubscriptionStatusコンポーネントを配置 */}
                <div className="mb-6">
                    <SubscriptionStatus onReloadSubscription={handleUpdate} />
                </div>

                <SubscriptionSettings />
            </motion.div>
        </div>
    );
}