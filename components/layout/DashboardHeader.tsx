// components/layout/DashboardHeader.tsx
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";

export function DashboardHeader() {
    const { data: session } = useSession();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    // クリックイベントハンドラを設定して、メニュー外のクリックを検知
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                buttonRef.current &&
                !menuRef.current.contains(event.target as Node) &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setIsMenuOpen(false);
            }
        };

        // イベントリスナーを追加
        document.addEventListener('mousedown', handleClickOutside);

        // クリーンアップ
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // セッションがない場合はログインページにリダイレクト
    if (!session) {
        return null;
    }

    // ユーザー情報
    const user = {
        name: session.user?.name || "ユーザー",
        image: session.user?.image || null,
        hasUploadedImage: !!session.user?.image
    };

    // ログアウト処理
    const handleLogout = async () => {
        await signOut({ callbackUrl: "/" });
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200">
            <div className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                <div className="flex items-center">
                    {/* ハンバーガーメニューボタンを削除 */}

                    {/* ロゴ */}
                    <Link href="/dashboard" className="flex items-center">
                        <Image
                            src="/logo.svg"
                            alt="Share"
                            width={100}
                            height={32}
                            className="h-8 w-auto"
                            priority
                        />
                    </Link>
                </div>

                <div className="flex items-center">
                    {/* ナビゲーションリンク - デスクトップ */}
                    <div className="hidden md:flex md:items-center md:space-x-6 mr-4">
                        <Link
                            href="/dashboard"
                            className="text-sm font-medium text-gray-700 hover:text-gray-900"
                        >
                            ダッシュボード
                        </Link>
                        <Link
                            href="/dashboard/profile"
                            className="text-sm font-medium text-gray-700 hover:text-gray-900"
                        >
                            プロフィール
                        </Link>
                        <Link
                            href="/dashboard/links"
                            className="text-sm font-medium text-gray-700 hover:text-gray-900"
                        >
                            SNS設定
                        </Link>
                        <Link
                            href="/dashboard/share"
                            className="text-sm font-medium text-gray-700 hover:text-gray-900"
                        >
                            共有
                        </Link>
                    </div>

                    {/* ユーザーアイコン */}
                    <div className="relative">
                        <button
                            ref={buttonRef}
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="flex items-center space-x-2 rounded-full focus:outline-none"
                        >
                            {user.hasUploadedImage && user.image ? (
                                // 画像がアップロードされている場合
                                <div className="overflow-hidden rounded-full border-2 border-transparent hover:border-blue-500 transition-colors">
                                    <Image
                                        src={user.image}
                                        alt={user.name}
                                        width={32}
                                        height={32}
                                        className="h-8 w-8 rounded-full object-cover"
                                    />
                                </div>
                            ) : (
                                // デフォルトのユーザーアイコン（人間アイコン）
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors">
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
                                </div>
                            )}
                            <span className="hidden md:inline-block text-sm font-medium">
                                {user.name}
                            </span>
                        </button>

                        {/* ドロップダウンメニュー */}
                        {isMenuOpen && (
                            <div
                                ref={menuRef}
                                className="absolute right-0 mt-2 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                                <Link
                                    href="/dashboard/profile"
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    プロフィール設定
                                </Link>
                                <Link
                                    href="/dashboard/design"
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    デザイン設定
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                                >
                                    ログアウト
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}