// components/layout/Footer.tsx
import React from 'react';
import Link from 'next/link';

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* サービス情報の上の区切り線は削除（ここには何も置かない） */}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* サービス情報 */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-600 tracking-wider uppercase">
                        サービス情報
                    </h3>
                    <ul className="mt-4 space-y-2">
                        <li>
                            <Link href="/terms" className="text-sm text-gray-500 hover:text-gray-900">
                                利用規約
                            </Link>
                        </li>
                        <li>
                            <Link href="/privacy" className="text-sm text-gray-500 hover:text-gray-900">
                                プライバシーポリシー
                            </Link>
                        </li>
                        <li>
                            <Link href="/legal" className="text-sm text-gray-500 hover:text-gray-900">
                                特定商取引法に基づく表記
                            </Link>
                        </li>
                    </ul>
                </div>

                {/* サポート */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-600 tracking-wider uppercase">
                        サポート
                    </h3>
                    <ul className="mt-4 space-y-2">
                        <li>
                            <Link href="/help" className="text-sm text-gray-500 hover:text-gray-900">
                                ヘルプセンター
                            </Link>
                        </li>
                        <li>
                            <Link href="/faq" className="text-sm text-gray-500 hover:text-gray-900">
                                よくあるご質問
                            </Link>
                        </li>
                        <li>
                            <Link href="/contact" className="text-sm text-gray-500 hover:text-gray-900">
                                お問い合わせ
                            </Link>
                        </li>
                    </ul>
                </div>

                {/* 会社情報 */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-600 tracking-wider uppercase">
                        会社情報
                    </h3>
                    <ul className="mt-4 space-y-2">
                        <li>
                            <a
                                href="https://bialpha.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-gray-500 hover:text-gray-900"
                            >
                                ビイアルファ株式会社
                            </a>
                        </li>
                        <li>
                            <Link href="/company" className="text-sm text-gray-500 hover:text-gray-900">
                                企業情報
                            </Link>
                        </li>
                        <li>
                            <Link href="/about" className="text-sm text-gray-500 hover:text-gray-900">
                                サービスについて
                            </Link>
                        </li>
                    </ul>
                </div>
            </div>

            {/* コピーライトの上の区切り線は維持 */}
            <div className="mt-8 border-t border-gray-200 pt-4">
                <p className="text-base text-gray-400 text-center">
                    &copy; {currentYear} Bialpha Inc. All rights reserved.
                </p>
            </div>
        </div>
    );
}