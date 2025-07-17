// components/layout/Footer.tsx
import React from 'react';
import Link from 'next/link';
export function Footer() {
    const currentYear = new Date().getFullYear();
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* サービス情報の上の区切り線は削除（ここには何も置かない） */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* サービス情報 */}
          <div>
            <h2 className="text-lg font-semibold mb-4">サービス情報</h2>
            <ul className="space-y-2">
              <li>
                <Link href="/legal/terms" className="text-gray-600 hover:text-blue-600">
                  利用規約
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="text-gray-600 hover:text-blue-600">
                  プライバシーポリシー
                </Link>
              </li>
              <li>
                <Link href="/legal/transactions" className="text-gray-600 hover:text-blue-600">
                  特定商取引法に基づく表記
                </Link>
              </li>
            </ul>
          </div>
          {/* サポート */}
          <div>
            <h2 className="text-lg font-semibold mb-4">サポート</h2>
            <ul className="space-y-2">
              <li>
                <Link href="/support/help" className="text-gray-600 hover:text-blue-600">
                  ヘルプセンター
                </Link>
              </li>
              <li>
                <Link href="/support/faq" className="text-gray-600 hover:text-blue-600">
                  よくあるご質問
                </Link>
              </li>
              <li>
                <Link href="/support/contact" className="text-gray-600 hover:text-blue-600">
                  お問い合わせ
                </Link>
              </li>
            </ul>
          </div>
          {/* 会社情報 */}
          <div>
            <h2 className="text-lg font-semibold mb-4">会社情報</h2>
            <ul className="space-y-2">
              <li>
                <Link href="/company/about" className="text-gray-600 hover:text-blue-600">
                  株式会社Senrigan
                </Link>
              </li>
              <li>
                <Link href="/company/service" className="text-gray-600 hover:text-blue-600">
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