// app/page.tsx
'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
export default function HomePage() {
  const router = useRouter();
  const handleNavigate = (path: string) => {
    router.push(path);
  };
  const useCases = [
    {
      title: "ビジネスシーン",
      description:
        "名刺の裏面にQRコードを印刷することで、名刺交換がデジタルとアナログを融合した体験へと進化します。相手はあなたのSNSや詳細なプロフィールにアクセスでき、より深い関係構築のきっかけとなります。",
      imagePath: "/images/usecase/business-scene.png",
      bgColor: "bg-primary",
      iconPath: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      ),
    },
    {
      title: "交流会・イベント",
      description:
        "新しい出会いの場で、素早く自分のSNSアカウントを共有。その場でフォローしあうことができ、つながりを即座に形成できます。後からいちいち連絡先を交換する手間が省けます。",
      imagePath: "/images/usecase/event-scene.png",
      bgColor: "bg-white",
      iconPath: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      ),
    },
    {
      title: "クリエイター活動",
      description:
        "YouTubeやInstagram、Xなど作品を発表しているSNSアカウントを一元的に共有でき、ファン獲得やフォロワー増加につながります。プロフィールURLをコンテンツに記載するだけで効果的な宣伝になります。",
      imagePath: "/images/usecase/creator-scene.png",
      bgColor: "bg-primary",
      iconPath: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      ),
    },
    {
      title: "日常のSNS共有",
      description:
        "友人や知人に「SNSのアカウント教えて」と言われたとき、一つ一つ教える手間が省けます。Shareプロフィールを共有するだけで完了です。あなたの時間を節約しながら、相手にも便利な体験を提供できます。",
      imagePath: "/images/usecase/daily-scene.png",
      bgColor: "bg-white",
      iconPath: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"
        />
      ),
    },
  ];
  return (
    <div className="min-h-screen flex flex-col">
      {/* ヒーローセクション */}
      <div className="relative flex flex-col md:flex-row h-screen">
        {/* 左側：メインコンテンツ */}
        <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-8 md:p-16 bg-white">
          <div className="w-full max-w-md space-y-8">
            {/* ロゴ */}
            <div className="flex justify-center mb-4">
              <Image src="/logo_blue.svg" alt="Share Logo" width={90} height={90} priority />
            </div>
            {/* テキストロゴ */}
            <div className="text-center mb-6">
              <Image
                src="/logo_share.svg"
                alt="Share Text"
                width={150}
                height={44}
                className="mx-auto"
              />
              <p className="mt-2 text-gray-600">シンプルにつながる、スマートにシェア。</p>
            </div>
            {/* CTA ボタン */}
            <div className="pt-8 space-y-4">
              <button
                onClick={() => handleNavigate('/auth/signin')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-all transform hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 min-h-[48px] md:min-h-0 flex items-center justify-center text-base md:text-sm"
              >
                ログイン
              </button>
              <button
                onClick={() => handleNavigate('/auth/signup')}
                className="w-full bg-white hover:bg-gray-50 text-blue-600 font-medium py-3 px-4 rounded-lg border border-blue-600 transition-all transform hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 min-h-[48px] md:min-h-0 flex items-center justify-center text-base md:text-sm"
              >
                新規登録
              </button>
            </div>
            {/* サービス特徴のリスト */}
            <div className="pt-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-justify">
                <div className="p-4 rounded-lg bg-blue-50 flex items-start space-x-3">
                  <div className="rounded-full bg-blue-100 p-2 mt-1">
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-800">SNSアカウントをまとめて管理</h3>
                    <p className="text-sm text-blue-600">複数SNSを一つのプロフィールに連携</p>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-blue-50 flex items-start space-x-3">
                  <div className="rounded-full bg-blue-100 p-2 mt-1">
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-800">QRコードでスマートに共有</h3>
                    <p className="text-sm text-blue-600">スキャン一つで必要情報をすぐ交換</p>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-blue-50 flex items-start space-x-3">
                  <div className="rounded-full bg-blue-100 p-2 mt-1">
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm11 1H6v8l4-2 4 2V6z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-800">自由自在のカスタマイズ</h3>
                    <p className="text-sm text-blue-600">あなた好みのデザインに変更可能</p>
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-blue-50 flex items-start space-x-3">
                  <div className="rounded-full bg-blue-100 p-2 mt-1">
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"></path>
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-800">ビジネスもプライベートも</h3>
                    <p className="text-sm text-blue-600">様々なシーンで活用できる柔軟性</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* 右側：デコレーション背景 */}
        <div className="hidden md:block md:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 blue-section-protection relative overflow-hidden">
          <div className="absolute inset-0 bg-blue-700 opacity-20">
            <div className="absolute inset-0 bg-pattern opacity-10"></div>
          </div>
          {/* 大きなロゴを背景に */}
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <Image
              src="/logo_blue.svg"
              alt="Share Logo Background"
              width={800}
              height={800}
              className="brightness-0 invert"
            />
          </div>
          {/* フローティング要素 */}
          <div className="absolute top-1/5 left-1/4 transform -translate-x-1/2 -translate-y-1/2 w-42 h-42 bg-white/10 backdrop-blur-sm rounded-2xl rotate-12 shadow-xl"></div>
          <div className="absolute bottom-1/5 right-1/4 transform translate-x-1/2 translate-y-1/2 w-60 h-60 bg-white/10 backdrop-blur-sm rounded-2xl -rotate-6 shadow-xl"></div>
          {/* コンテンツ */}
          <div className="absolute inset-0 flex flex-col justify-center items-center p-8">
            <div className="max-w-md text-center z-10">
              <h2 className="text-3xl font-bold text-white mb-6">つながりを、もっとスマートに</h2>
              <p className="text-xl text-white/90 mb-8">
                SNSアカウントを一度に共有。
                <br />
                初めましての挨拶をもっとスムーズに。
              </p>
              <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl text-left">
                <p className="text-white mb-3 text-justify">
                  「Share」を使えば、あなたのSNSアカウントと連絡先情報をひとつにまとめて、簡単に共有できます。
                </p>
                <p className="text-white/80 text-justify">
                  QRコードでシェアして、ビジネスでもプライベートでも人とのつながりをもっと簡単に。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* ユースケースセクション */}
      <div className="pt-24 pb-16 bg-gray-50 mt-0 md:mt-0">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 pt-8">
            <h2 className="text-3xl font-bold text-gray-900">Shareの活用シーン</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
              あらゆるシーンで活躍するShare。ビジネスからプライベートまで、人とのつながりをもっとスマートに。
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {useCases.map((useCase, index) => (
              <div
                key={index}
                className="bg-white rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1"
              >
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div
                      className={`rounded-full p-3 mr-4 ${index % 2 === 0 ? 'bg-blue-100' : 'bg-blue-100'}`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-6 w-6 ${index % 2 === 0 ? 'text-blue-600' : 'text-blue-600'}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        {useCase.iconPath}
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{useCase.title}</h3>
                  </div>
                  <p className="text-gray-600 mb-6 text-justify">{useCase.description}</p>
                  {useCase.imagePath && (
                    <div className="mt-6 rounded-lg overflow-hidden">
                      <Image
                        src={useCase.imagePath}
                        alt={useCase.title}
                        width={500}
                        height={300}
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* フッター */}
      <footer className="py-6 bg-gray-100 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-sm text-gray-500">© 2025 Share. All rights reserved.</p>
            </div>
            <div className="flex space-x-6">
              <Link href="/legal/terms" className="text-sm text-gray-500 hover:text-blue-600">
                利用規約
              </Link>
              <Link href="/legal/privacy" className="text-sm text-gray-500 hover:text-blue-600">
                プライバシーポリシー
              </Link>
              <Link href="/support/contact" className="text-sm text-gray-500 hover:text-blue-600">
                お問い合わせ
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}