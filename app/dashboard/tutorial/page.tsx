// app/dashboard/tutorial/page.tsx
'use client';
import { useState } from 'react';
import { HiPlay, HiClock, HiAcademicCap } from 'react-icons/hi';

export default function TutorialPage() {
  const [expandedSection, setExpandedSection] = useState<string | null>('basic');

  const tutorials = [
    {
      id: 'basic',
      title: '3分(早送り)でわかる！ Shareのプロフィール作成・共有ガイド',
      duration: '約9分',
      level: '初心者向け',
      videoUrl: 'https://youtu.be/gRWwERxK2n4',
      description:
        '誰でも簡単に設定できるプロフィールの作成方法から、SNSリンクの追加、QRコードの生成、そして共有まで、Shareの便利な機能を詳しく解説します。',
      topics: [
        {
          title: 'プロフィール設定',
          description: 'わずか数ステップで、あなただけのプロフィールページを作成できます。',
        },
        {
          title: 'SNSリンク',
          description:
            '複数のSNSアカウントをまとめて表示し、あなたのソーシャルネットワークを簡単に共有できます。',
        },
        {
          title: 'QRコード',
          description:
            'ワンタップでQRコードを生成し、相手に素早くプロフィールを共有する方法を紹介します。',
        },
        {
          title: '連絡先への追加',
          description:
            '相手があなたのプロフィールを簡単に連絡先に登録できるようになる便利な機能です。',
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">使い方動画</h1>
          <p className="text-muted-foreground">Shareの機能や使い方を動画で学びましょう</p>
        </div>
      </div>

      <div className="space-y-4">
        {tutorials.map((tutorial) => (
          <div
            key={tutorial.id}
            className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
          >
            {/* ヘッダー部分 */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-red-50 to-white text-justify">
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-red-100 rounded-full">
                    <HiPlay className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-gray-900">{tutorial.title}</h3>
                    <div className="flex items-center mt-1 space-x-3">
                      <span className="inline-flex items-center text-sm text-gray-500">
                        <HiClock className="h-4 w-4 mr-1" />
                        {tutorial.duration}
                      </span>
                      <span className="inline-flex items-center text-sm text-gray-500">
                        <HiAcademicCap className="h-4 w-4 mr-1" />
                        {tutorial.level}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* コンテンツ部分 */}
            <div className="px-6 py-4">
              <p className="text-gray-600 text-sm text-justify leading-relaxed mb-4">
                {tutorial.description}
              </p>

              {/* 学べること */}
              <button
                onClick={() =>
                  setExpandedSection(expandedSection === tutorial.id ? null : tutorial.id)
                }
                className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors mb-3"
              >
                {expandedSection === tutorial.id ? '詳細を閉じる ▲' : '動画で学べること ▼'}
              </button>

              {expandedSection === tutorial.id && (
                <div className="mt-3 space-y-3 bg-gray-50 rounded-lg p-4 text-justify">
                  {tutorial.topics.map((topic, index) => (
                    <div key={index} className="flex items-start">
                      <div className="flex-shrink-0 w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5"></div>
                      <div className="ml-3">
                        <span className="font-medium text-sm text-gray-900">{topic.title}：</span>
                        <span className="text-sm text-gray-600 ml-1">{topic.description}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* YouTubeリンクボタン */}
              <div className="flex justify-center mt-6">
                <a
                  href={tutorial.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center 
                            w-full sm:w-auto sm:min-w-[200px] 
                            px-6 sm:px-8 py-4 sm:py-4 
                            bg-red-600 text-white 
                            text-base sm:text-lg font-medium 
                            rounded-md hover:bg-red-700 active:bg-red-800 
                            transition-all duration-150 transform hover:scale-105 
                            shadow-lg hover:shadow-xl"
                >
                  <svg
                    className="w-6 h-6 sm:w-7 sm:h-7 mr-2"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                  <span className="font-semibold">動画を見る</span>
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 今後追加予定のセクション */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200 text-justify">
        <p className="text-sm text-blue-700">
          今後、より詳しい使い方動画を追加予定です。ご期待ください！
        </p>
      </div>
    </div>
  );
}