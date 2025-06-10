// components/dashboard/ImprovedDesignPreview.tsx
'use client';
import { useState, useEffect, useMemo } from 'react';
import { ImprovedSnsIcon } from '@/components/shared/ImprovedSnsIcon';
import { type SnsPlatform } from '@/types/sns';
import type { User } from '@prisma/client';
import { motion } from 'framer-motion';

// 型拡張
interface ExtendedUser extends User {
  snsIconColor: string | null;
  headerText: string | null;
  textColor: string | null;
}

interface ImprovedDesignPreviewProps {
  user: User;
}

export function ImprovedDesignPreview({ user }: ImprovedDesignPreviewProps) {
  const extendedUser = user as ExtendedUser;

  // 🚀 useMemoで値を安定化
  const previewData = useMemo(() => {
    const data = {
      mainColor: user.mainColor || '#3B82F6',
      snsIconColor: extendedUser.snsIconColor || '#333333',
      headerText: extendedUser.headerText || 'シンプルにつながる、スマートにシェア。',
      textColor: extendedUser.textColor || '#FFFFFF',
      timestamp: Date.now(), // 変更検出用
    };
    return data;
  }, [user.mainColor, extendedUser.snsIconColor, extendedUser.headerText, extendedUser.textColor]);

  // 🚀 強制更新用のキー
  const [updateKey, setUpdateKey] = useState(0);

  // 🚀 プレビューデータが変更されたら強制更新
  useEffect(() => {
    setUpdateKey((prev) => {
      const newKey = prev + 1;
      return newKey;
    });
  }, [previewData]);

  // 安全な値を設定
  const safeTextColor = previewData.textColor || '#FFFFFF';
  const safeSnsIconColor =
    previewData.snsIconColor === 'original' ? 'original' : previewData.snsIconColor || '#333333';

  // テスト用のダミーデータ
  const dummySnsLinks = [
    { platform: 'line', name: 'LINE' },
    { platform: 'youtube', name: 'YouTube' },
    { platform: 'x', name: 'X' },
    { platform: 'instagram', name: 'Instagram' },
  ];

  return (
    <div
      className="border border-gray-200 rounded-lg overflow-hidden shadow-sm max-w-xs mx-auto"
      style={{ backgroundColor: '#e8eaee' }}
    >
      {/* ヘッダー部分 - 法人版と完全に同じ */}
      <div
        key={`header-${updateKey}`}
        className="w-full relative overflow-hidden flex items-center justify-center py-3"
        style={{
          backgroundColor: previewData.mainColor,
        }}
      >
        <div
          key={`header-text-${updateKey}`}
          className="text-sm px-4 text-center whitespace-pre-wrap"
          style={{
            color: safeTextColor,
          }}
        >
          {previewData.headerText}
        </div>
      </div>

      <div className="p-5">
        {/* ユーザー名 - 法人版と同じ位置 */}
        <div className="text-center mt-2 mb-3">
          <h3 className="text-xl font-bold text-gray-900">{user.name || 'Your Name'}</h3>
          {user.nameEn && <p className="text-sm text-gray-500">{user.nameEn}</p>}
        </div>

        {/* SNSリンク - 法人版と同じレイアウト */}
        <div className="mt-4 grid grid-cols-4 gap-3">
          {dummySnsLinks.map((link, index) => (
            <motion.div
              key={`${link.platform}-${updateKey}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="flex flex-col items-center"
            >
              <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-white shadow-sm mb-1 transition-transform hover:shadow-md">
                <ImprovedSnsIcon
                  platform={link.platform as SnsPlatform}
                  size={30}
                  color={safeSnsIconColor}
                />
              </div>
              <span className="text-xs text-center w-full">{link.name}</span>
            </motion.div>
          ))}
        </div>

        {/* アクションボタン部分 - 法人版と同じレイアウト */}
        <div className="mt-6 grid grid-cols-4 gap-3">
          {/* 自己紹介ボタン */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mb-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <span className="text-xs">自己紹介</span>
          </div>

          {/* 会社HPボタン */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mb-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </div>
            <span className="text-xs">会社HP</span>
          </div>

          {/* メールボタン */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mb-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <span className="text-xs">メール</span>
          </div>

          {/* 電話ボタン */}
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center mb-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>
            <span className="text-xs">電話</span>
          </div>
        </div>

        {/* 主要アクションボタン - 法人版と同じレイアウト */}
        <div className="mt-5 space-y-3">
          <button
            key={`phone-button-${updateKey}`}
            className="w-full py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center"
            style={{
              backgroundColor: previewData.mainColor,
              color: safeTextColor,
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            電話をかける
          </button>
          <button
            key={`contact-button-${updateKey}`}
            className="w-full py-2 rounded-md text-sm font-medium border transition-all flex items-center justify-center bg-white"
            style={{ borderColor: previewData.mainColor, color: '#333' }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
            連絡先に追加
          </button>
        </div>

        {/* フッター - 法人版と同じレイアウト */}
        <div className="mt-6 text-center">
          <a href="#" className="text-sm text-[#2563EB]">
            このサービスを使ってみる
          </a>
          <div className="mt-2 pt-2 border-t border-gray-300">
            <p className="text-xs text-gray-500">Powered by Share</p>
          </div>
        </div>
      </div>
    </div>
  );
}