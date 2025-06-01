// components/dashboard/ImprovedDesignPreview.tsx (最終修正版)
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

    console.log('🎨 [Preview] データ更新:', data);
    return data;
  }, [user.mainColor, extendedUser.snsIconColor, extendedUser.headerText, extendedUser.textColor]);

  // 🚀 強制更新用のキー
  const [updateKey, setUpdateKey] = useState(0);

  // 🚀 プレビューデータが変更されたら強制更新
  useEffect(() => {
    setUpdateKey((prev) => {
      const newKey = prev + 1;
      console.log('🎨 [Preview] 強制更新:', newKey, previewData);
      return newKey;
    });
  }, [previewData]);

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
        key={`preview-${updateKey}`} // 🔥 強制更新キー
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-xs overflow-hidden rounded-lg border shadow-sm mx-auto"
        style={{ backgroundColor: '#e8eaee' }}
      >
        {/* ヘッダー部分 */}
        <div
          key={`header-${updateKey}`} // 🔥 個別に強制更新
          className="h-12 w-full relative overflow-hidden flex items-center justify-center"
          style={{
            backgroundColor: previewData.mainColor,
          }}
        >
          <p
            key={`header-text-${updateKey}`} // 🔥 テキストも強制更新
            className="text-sm px-2 text-center"
            style={{
              color: previewData.textColor,
            }}
          >
            {previewData.headerText}
          </p>
        </div>

        <div className="p-5">
          {/* ユーザー名 */}
          <div className="text-center mt-2 mb-6">
            <h3 className="text-lg font-bold">{user.name || 'Your Name'}</h3>
            {user.nameEn && <p className="text-sm text-muted-foreground">{user.nameEn}</p>}
          </div>

          {/* SNSリンク（サンプル） */}
          <div className="grid grid-cols-4 gap-3">
            {dummySnsLinks.map((link, index) => (
              <motion.div
                key={`${link.platform}-${updateKey}`} // 🔥 SNSアイコンも強制更新
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="flex flex-col items-center"
              >
                <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-white shadow-sm mb-1 transition-transform hover:shadow-md">
                  <ImprovedSnsIcon
                    platform={link.platform as SnsPlatform}
                    size={30}
                    color={
                      previewData.snsIconColor === 'original'
                        ? 'original'
                        : previewData.snsIconColor
                    }
                  />
                </div>
                <span className="text-xs">{link.name}</span>
              </motion.div>
            ))}
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
              key={`phone-button-${updateKey}`} // 🔥 ボタンも強制更新
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center"
              style={{
                backgroundColor: previewData.mainColor,
                color: previewData.textColor,
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
            </motion.button>
            <motion.button
              key={`contact-button-${updateKey}`} // 🔥 ボタンも強制更新
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
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
            </motion.button>
          </div>

          {/* フッター */}
          <div className="mt-6 text-center">
            <a href="#" className="text-sm text-blue-600">
              このサービスを使ってみる
            </a>
            <div className="mt-2 pt-2 border-t border-gray-300">
              <p className="text-xs text-gray-500">Powered by Share</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}