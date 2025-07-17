// app/company/about/page.tsx
import { PageLayout } from '@/components/layout/PageLayout';
import { Metadata } from 'next';
import React from 'react';
import Link from 'next/link';
export const metadata: Metadata = {
  title: '株式会社Senrigan | Share',
  description: 'Shareを運営する株式会社Senriganについての情報です。',
};
export default function CompanyAboutPage() {
  return (
    <PageLayout
      title="株式会社Senrigan"
      breadcrumbs={[
        { name: 'ホーム', href: '/' },
        { name: '株式会社Senrigan', href: '/company/about' },
      ]}
    >
      <div className="space-y-8 text-justify">
        <section>
          <h2 className="text-xl font-semibold mb-4">会社概要</h2>
          <table className="w-full border-collapse">
            <tbody>
              <tr className="border-b">
                <th className="text-left py-4 px-4 font-semibold bg-gray-50 w-1/3">社名</th>
                <td className="py-4 px-4">
                  <Link
                    href="https://senrigan.systems"
                    className="text-blue-600 hover:text-blue-800 inline-flex items-center"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    株式会社Senrigan
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 ml-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </Link>
                </td>
              </tr>
              <tr className="border-b">
                <th className="text-left py-4 px-4 font-semibold bg-gray-50">設立</th>
                <td className="py-4 px-4">2000年8月10日</td>
              </tr>
              <tr className="border-b">
                <th className="text-left py-4 px-4 font-semibold bg-gray-50">代表取締役</th>
                <td className="py-4 px-4">宮川 清実</td>
              </tr>
              <tr className="border-b">
                <th className="text-left py-4 px-4 font-semibold bg-gray-50">所在地</th>
                <td className="py-4 px-4">
                  〒731-0137
                  <br />
                  広島県広島市安佐南区山本2-3-35
                </td>
              </tr>
              <tr className="border-b">
                <th className="text-left py-4 px-4 font-semibold bg-gray-50">事業内容</th>
                <td className="py-4 px-4">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>SNS連携サービス「Share」の企画・開発・運営</li>
                    <li>ウェブアプリケーション開発</li>
                    <li>デジタルマーケティングソリューション提供</li>
                  </ul>
                </td>
              </tr>
              <tr className="border-b">
                <th className="text-left py-4 px-4 font-semibold bg-gray-50">資本金</th>
                <td className="py-4 px-4">1,000万円</td>
              </tr>
              <tr className="border-b">
                <th className="text-left py-4 px-4 font-semibold bg-gray-50">従業員数</th>
                <td className="py-4 px-4">15名（2024年4月現在）</td>
              </tr>
              <tr className="border-b">
                <th className="text-left py-4 px-4 font-semibold bg-gray-50">問い合わせ</th>
                <td className="py-4 px-4">
                  メール: info@sns-share.com
                  <br />
                  電話: 082-209-0181（平日10:00〜18:00）
                </td>
              </tr>
            </tbody>
          </table>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-4">企業理念</h2>
          <p className="mb-4 text-justify">
            「人と人とのつながりをシンプルに」をビジョンに掲げ、デジタル時代の新しいコミュニケーション手段を提供します。
          </p>
          <p className="text-justify">
            現代社会では、人々は複数のSNSプラットフォームを使い分け、多様なコミュニケーション手段を持っています。それらの情報を簡単に共有できる場を作ることで、より豊かなつながりの実現を目指しています。
          </p>
        </section>
      </div>
    </PageLayout>
  );
}
