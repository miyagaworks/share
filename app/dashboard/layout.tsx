// app/dashboard/layout.tsx
"use client";

import React, { ReactNode, useState, useEffect } from "react";
import { redirect, usePathname } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Footer } from "@/components/layout/Footer";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import {
    HiHome,
    HiUser,
    HiLink,
    HiColorSwatch,
    HiShare,
    HiCreditCard,
    HiMenu,
    HiX
} from "react-icons/hi";

// サイドバーナビゲーション項目の型定義
interface NavItem {
    href: string;
    label: string;
    icon: ReactNode;
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const { data: session, status } = useSession();
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // クライアントサイドでのみレンダリングするため
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // 認証が読み込み中の場合は何も表示しない
    if (status === "loading") {
        return null;
    }

    // 認証されていない場合はリダイレクト
    if (!session) {
        redirect("/auth/signin");
    }

    // ナビゲーション項目の定義
    const navItems: NavItem[] = [
        {
            href: "/dashboard",
            label: "ダッシュボード",
            icon: <HiHome className="w-5 h-5" />
        },
        {
            href: "/dashboard/profile",
            label: "プロフィール編集",
            icon: <HiUser className="w-5 h-5" />
        },
        {
            href: "/dashboard/links",
            label: "SNS・リンク管理",
            icon: <HiLink className="w-5 h-5" />
        },
        {
            href: "/dashboard/design",
            label: "デザイン設定",
            icon: <HiColorSwatch className="w-5 h-5" />
        },
        {
            href: "/dashboard/share",
            label: "共有設定",
            icon: <HiShare className="w-5 h-5" />
        },
        {
            href: "/dashboard/subscription",
            label: "サブスクリプション",
            icon: <HiCreditCard className="w-5 h-5" />
        }
    ];

    // マウントされていない場合は何も表示しない
    if (!isMounted) {
        return null;
    }

    // モバイルメニューボタンのクリックハンドラー
    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    return (
        <React.Fragment>
            <div className="flex flex-col min-h-screen bg-gray-50">
                {/* ヘッダー - DashboardHeaderコンポーネントを使用 */}
                <DashboardHeader />

                {/* メインコンテンツエリア (固定ヘッダーのため上部マージンを追加) */}
                <div className="flex flex-1 pt-16">
                    {/* モバイルメニュー - オーバーレイ */}
                    {isMobileMenuOpen && (
                        <div
                            className="fixed inset-0 z-30 md:hidden"
                            style={{ backgroundColor: 'rgba(255, 255, 255, 0.7)' }}
                            onClick={toggleMobileMenu}
                        />
                    )}

                    {/* モバイルサイドバー */}
                    <div
                        className={`fixed inset-y-0 left-0 z-30 w-64 bg-white transform transition-transform duration-300 ease-in-out md:hidden ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                            }`}
                        style={{ top: '64px' }}
                    >
                        <div className="h-16 flex items-center justify-between px-4 border-b">
                            <span className="text-xl font-bold text-blue-600">メニュー</span>
                            <button
                                type="button"
                                className="inline-flex items-center justify-center rounded-md p-2 text-gray-500 hover:bg-gray-100"
                                onClick={toggleMobileMenu}
                            >
                                <HiX className="h-6 w-6" />
                            </button>
                        </div>
                        <nav className="mt-4 px-2 space-y-1">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${pathname === item.href
                                            ? "bg-blue-50 text-blue-600"
                                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                                        }`}
                                    onClick={toggleMobileMenu}
                                >
                                    <span className="mr-3 text-gray-500">{item.icon}</span>
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    {/* デスクトップサイドバー */}
                    <div className="hidden md:block w-64 flex-shrink-0 border-r border-gray-200 bg-white">
                        <nav className="flex flex-col h-full p-4 space-y-1">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${pathname === item.href
                                            ? "bg-blue-50 text-blue-600"
                                            : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                                        }`}
                                >
                                    <span className="mr-3 text-gray-500">{item.icon}</span>
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    {/* メインコンテンツ */}
                    <div className="flex-1 w-full md:w-auto">
                        <main className="container mx-auto px-4 py-6 mb-20">{children}</main>

                        {/* モバイルメニューボタン - 画面右下に固定 */}
                        <button
                            type="button"
                            className="md:hidden fixed bottom-4 right-4 z-30 w-12 h-12 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center"
                            onClick={toggleMobileMenu}
                        >
                            {isMobileMenuOpen ? <HiX className="h-6 w-6" /> : <HiMenu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>

                {/* フッター */}
                <footer className="w-full mt-auto bg-white border-t border-gray-200 pt-6 pb-4 px-4">
                    <Footer />
                </footer>
            </div>
        </React.Fragment>
    );
}