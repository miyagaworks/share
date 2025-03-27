// components/layout/Sidebar.tsx
"use client";

import React, { useState, useEffect } from 'react';
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// サイドバー項目の型定義
interface SidebarItem {
    title: string;
    href: string;
    icon: React.ReactNode;
    badge?: number | string;
}

interface SidebarProps {
    items: SidebarItem[];
    className?: string;
}

export function Sidebar({ items = [], className }: SidebarProps) {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // レスポンシブ対応
    useEffect(() => {
        const checkSize = () => {
            setIsMobile(window.innerWidth < 768); // md ブレークポイント
            setCollapsed(window.innerWidth < 1280);
        };

        checkSize();
        window.addEventListener("resize", checkSize);
        return () => window.removeEventListener("resize", checkSize);
    }, []);

    // モバイルでは表示しない
    if (isMobile) return null;

    return (
        <div
            className={cn(
                "hidden md:block fixed top-16 bottom-0 overflow-y-auto border-r border-gray-200 bg-white z-30",
                collapsed ? "w-16" : "w-64",
                className
            )}
            style={{ height: 'calc(100vh - 4rem)' }} // 16px * 4 = 64px (ヘッダーの高さ)
        >
            <div className="flex flex-col h-full">
                <div className="flex-1 py-5 px-3">
                    <nav className="space-y-1">
                        {items?.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "group flex items-center rounded-md px-2 py-2 text-sm font-medium transition-colors",
                                    pathname === item.href
                                        ? "bg-blue-50 text-blue-600"
                                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                                )}
                            >
                                <div className="mr-3 flex-shrink-0 text-gray-500">{item.icon}</div>
                                {!collapsed && (
                                    <span className="flex-1 whitespace-nowrap">
                                        {item.title}
                                    </span>
                                )}
                                {item.badge && !collapsed && (
                                    <span className="ml-auto inline-flex h-5 items-center justify-center rounded-full bg-blue-100 px-2 text-xs font-medium text-blue-800">
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        ))}
                    </nav>
                </div>

                {/* サイドバー制御ボタン */}
                <div className="flex shrink-0 items-center justify-center border-t border-gray-200 p-4">
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="p-1 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none"
                        aria-label={collapsed ? "展開する" : "折りたたむ"}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-6 w-6 transform transition-transform ${collapsed ? "rotate-180" : ""}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d={collapsed ? "M13 5l7 7-7 7" : "M11 19l-7-7 7-7"}
                            />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}