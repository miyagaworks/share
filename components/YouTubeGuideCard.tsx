// components/YouTubeGuideCard.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { HiPlay, HiAcademicCap, HiClock, HiX } from 'react-icons/hi';

export function YouTubeGuideCard() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // 一度閉じたら表示しない
  useEffect(() => {
    const dismissedKey = 'youtube-guide-dismissed';
    if (localStorage.getItem(dismissedKey)) {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('youtube-guide-dismissed', 'true');
    setIsDismissed(true);
  };

  if (isDismissed) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-gradient-to-br from-red-50 via-white to-red-50 shadow-sm overflow-hidden">
      <div className="relative">
        {/* ヘッダー部分 */}
        <div className="px-6 py-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full">
                <HiPlay className="h-5 w-5 text-red-600" />
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  3分でわかる！Shareのプロフィール作成・共有ガイド
                </h3>
                <div className="flex items-center mt-1 space-x-3">
                  <span className="inline-flex items-center text-sm text-gray-500">
                    <HiClock className="h-4 w-4 mr-1" />
                    約3分
                  </span>
                  <span className="inline-flex items-center text-sm text-gray-500">
                    <HiAcademicCap className="h-4 w-4 mr-1" />
                    初心者向け
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="閉じる"
            >
              <HiX className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* コンテンツ部分 */}
        <div className="px-6 py-4">
          <p className="text-gray-600 text-sm leading-relaxed">
            この動画では、誰でも簡単に設定できるプロフィールの作成方法から、SNSリンクの追加、QRコードの生成、そして共有まで、Shareの便利な機能を詳しく解説します。
          </p>

          {/* 展開可能なセクション */}
          <div className="mt-4">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              {isExpanded ? '詳細を閉じる ▲' : '動画で学べること ▼'}
            </button>

            {isExpanded && (
              <div className="mt-3 space-y-3 bg-gray-50 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5"></div>
                  <div className="ml-3">
                    <span className="font-medium text-sm text-gray-900">プロフィール設定：</span>
                    <span className="text-sm text-gray-600 ml-1">
                      わずか数ステップで、あなただけのプロフィールページを作成できます。
                    </span>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5"></div>
                  <div className="ml-3">
                    <span className="font-medium text-sm text-gray-900">SNSリンク：</span>
                    <span className="text-sm text-gray-600 ml-1">
                      複数のSNSアカウントをまとめて表示し、あなたのソーシャルネットワークを簡単に共有できます。
                    </span>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5"></div>
                  <div className="ml-3">
                    <span className="font-medium text-sm text-gray-900">QRコード：</span>
                    <span className="text-sm text-gray-600 ml-1">
                      ワンタップでQRコードを生成し、相手に素早くプロフィールを共有する方法を紹介します。
                    </span>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5"></div>
                  <div className="ml-3">
                    <span className="font-medium text-sm text-gray-900">連絡先への追加：</span>
                    <span className="text-sm text-gray-600 ml-1">
                      相手があなたのプロフィールを簡単に連絡先に登録できるようになる便利な機能です。
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <p className="mt-4 text-sm text-gray-600">
            この動画を見れば、あなたのプロフィールをより魅力的に、より効率的に共有できるようになります。
          </p>

          {/* YouTubeリンクボタン */}
          <div className="mt-5 flex items-center space-x-3">
            <a
              href="https://youtu.be/gRWwERxK2n4"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 active:bg-red-800 transition-all duration-150 transform hover:scale-105 shadow-sm"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
              動画を見る
            </a>
            <button
              onClick={handleDismiss}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              後で見る
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}