// components/layout/DashboardLayout.tsx
"use client";

import React, { ReactNode, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// アイコンコンポーネント
const DashboardIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
    </svg>
);

const ProfileIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

const LinksIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
);

const DesignIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <circle cx="13.5" cy="6.5" r="2.5" />
        <circle cx="19" cy="13" r="2.5" />
        <circle cx="6" cy="12" r="2.5" />
        <circle cx="9" cy="18" r="2.5" />
        <path d="M14.6 12.5 19 9" />
        <path d="m8.3 9.6-1.8 1.9" />
        <path d="m12.7 15.3-3.1 2.2" />
    </svg>
);

const ShareIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
);

const SubscriptionIcon = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
);

// サイドバー項目の定義
const sidebarItems = [
    {
        title: "ダッシュボード",
        href: "/dashboard",
        icon: <DashboardIcon />,
    },
    {
        title: "プロフィール編集",
        href: "/dashboard/profile",
        icon: <ProfileIcon />,
    },
    {
        title: "SNS・リンク管理",
        href: "/dashboard/links",
        icon: <LinksIcon />,
    },
    {
        title: "デザイン設定",
        href: "/dashboard/design",
        icon: <DesignIcon />,
    },
    {
        title: "共有設定",
        href: "/dashboard/share",
        icon: <ShareIcon />,
    },
    {
        title: "ご利用プラン",
        href: "/dashboard/subscription",
        icon: <SubscriptionIcon />,
    },
];

interface DashboardLayoutProps {
    children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const pathname = usePathname();
    const [isMobile, setIsMobile] = useState(false);

    // 画面サイズの変更を監視
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 1024);
        };

        handleResize();
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    // 現在のページタイトルを取得
    const getPageTitle = () => {
        const item = sidebarItems.find((item) => item.href === pathname);
        return item ? item.title : "ダッシュボード";
    };

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Header />

            {/* サイドバー */}
            <Sidebar items={sidebarItems} />

            {/* メインコンテンツ */}
            <div className="flex-1 pt-16 md:ml-64">
                <main className="container mx-auto px-4 py-6 md:px-6 lg:px-8">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">{getPageTitle()}</h1>
                        <div className="h-1 w-10 bg-blue-600 mt-2"></div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className={cn("pb-12", isMobile && "pt-4")}
                    >
                        {children}
                    </motion.div>
                </main>
            </div>
        </div>
    );
}

// ダッシュボードページのセクションコンポーネント
interface DashboardSectionProps {
    title?: string;
    description?: string;
    children: ReactNode;
    className?: string;
}

export function DashboardSection({
    title,
    description,
    children,
    className,
}: DashboardSectionProps) {
    return (
        <div className={cn("my-6", className)}>
            {(title || description) && (
                <div className="mb-4">
                    {title && <h2 className="text-xl font-semibold text-gray-900">{title}</h2>}
                    {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
                </div>
            )}
            {children}
        </div>
    );
}