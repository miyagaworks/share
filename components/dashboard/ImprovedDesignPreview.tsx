// components/dashboard/ImprovedDesignPreview.tsx
'use client';

import { useState, useEffect } from 'react';
import { ImprovedSnsIcon } from '@/components/shared/ImprovedSnsIcon';
import { type SnsPlatform } from '@/types/sns';
import type { User } from '@prisma/client';
import { motion } from 'framer-motion';

// 型拡張
interface ExtendedUser extends User {
  snsIconColor: string | null; // null を使用し、undefined を排除
  headerText: string | null;
  textColor: string | null;
}

interface ImprovedDesignPreviewProps {
  user: User;
}

export function ImprovedDesignPreview({ user }: ImprovedDesignPreviewProps) {
  const extendedUser = user as ExtendedUser;

  // 親コンポーネントの状態が変更された時に更新するためのキー
  const [key, setKey] = useState(0);
  const [mainColor, setMainColor] = useState(user.mainColor || '#3B82F6');
  const [snsIconColor, setSnsIconColor] = useState(extendedUser.snsIconColor || '#333333');
  const [headerText, setHeaderText] = useState(
    extendedUser.headerText || 'シンプルにつながる、スマートにシェア。',
  );
  const [textColor, setTextColor] = useState(extendedUser.textColor || '#FFFFFF');

  // ユーザーのカラー設定が変更されたら更新
  useEffect(() => {
    setMainColor(user.mainColor || '#3B82F6');
    setSnsIconColor(extendedUser.snsIconColor || '#333333');
    setHeaderText(extendedUser.headerText || 'シンプルにつながる、スマートにシェア。');
    setTextColor(extendedUser.textColor || '#FFFFFF');
    setKey((prev) => prev + 1);
  }, [user.mainColor, extendedUser.snsIconColor, extendedUser.headerText, extendedUser.textColor]);

  // テスト用のダミーデータ
  const dummySnsLinks = [
    { platform: 'line', name: 'LINE' },
    { platform: 'youtube', name: 'YouTube' },
    { platform: 'x', name: 'X' },
    { platform: 'instagram', name: 'Instagram' },
  ];

  return (
    <div className="flex justify-center w-full">
      <motion.div
        key={key}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-xs overflow-hidden rounded-lg border shadow-sm mx-auto"
        style={{ backgroundColor: '#e8eaee' }}
      >
        {/* ヘッダー部分 */}
        <div
          className="h-12 w-full relative overflow-hidden flex items-center justify-center"
          style={{ backgroundColor: mainColor }}
        >
          <p className="text-sm px-2 text-center" style={{ color: textColor }}>
            {headerText}
          </p>
        </div>

        <div className="p-5">
          {/* ユーザー名 */}
          <div className="text-center mt-2 mb-6">
            <h3 className="text-lg font-bold">{user.name || 'Your Name'}</h3>
            {user.nameEn && <p className="text-sm text-muted-foreground">{user.nameEn}</p>}
          </div>

          {/* SNSリンク（サンプル） */}
          <div className="mt-4">
            <div className="grid grid-cols-4 gap-3">
              {dummySnsLinks.map((link, index) => (
                <motion.div
                  key={link.platform}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-16 h-16 flex items-center justify-center rounded-2xl bg-white shadow-sm mb-1 transition-transform hover:shadow-md">
                    <ImprovedSnsIcon
                      platform={link.platform as SnsPlatform}
                      size={38}
                      color={snsIconColor === 'original' ? 'original' : snsIconColor}
                    />
                  </div>
                  <span className="text-xs">{link.name}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* アクションボタン（プロフィール情報、会社HP、メール、電話） */}
          <div className="mt-6">
            <div className="grid grid-cols-4 gap-3">
              {/* 自己紹介ボタン */}
              <motion.div
                className="flex flex-col items-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
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
                <span className="text-xs text-gray-900">自己紹介</span>
              </motion.div>

              {/* 会社HPボタン */}
              <motion.div
                className="flex flex-col items-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.05 }}
              >
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
                <span className="text-xs text-gray-900">会社HP</span>
              </motion.div>

              {/* メールボタン */}
              <motion.div
                className="flex flex-col items-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.1 }}
              >
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
                <span className="text-xs text-gray-900">メール</span>
              </motion.div>

              {/* 電話ボタン */}
              <motion.div
                className="flex flex-col items-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.15 }}
              >
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
                <span className="text-xs text-gray-900">電話</span>
              </motion.div>
            </div>
          </div>

          {/* 主要アクションボタン */}
          <div className="mt-6 space-y-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center"
              style={{ backgroundColor: mainColor, color: textColor }}
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
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-2 rounded-md text-sm font-medium border transition-all flex items-center justify-center"
              style={{ borderColor: mainColor, color: '#333' }}
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
            </motion.button>
          </div>

          {/* フッター */}
          <div className="mt-6 pt-4 border-t border-gray-300 text-center">
            <a href="#" className="text-sm text-blue-600">
              このサービスを使ってみる
            </a>
            <p className="text-xs text-gray-500 mt-2">Powered by Share</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}