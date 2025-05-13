// app/not-found.tsx
'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function NotFound() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 px-4">
      <div className="max-w-md w-full text-center">
        {/* アニメーション付きの404テキスト */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <div className="text-[180px] font-bold text-gray-200 leading-none select-none">404</div>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="text-2xl md:text-3xl font-semibold text-gray-800 mt-2">
              ページが見つかりません
            </div>
          </motion.div>
        </motion.div>

        {/* 説明テキスト */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-6 text-gray-600"
        >
          お探しのページは存在しないか、プライベート設定になっている可能性があります。
        </motion.p>

        {/* ホームページに戻るリンク */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="mt-8"
        >
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-5 py-3 text-base font-medium text-white hover:bg-blue-700 transition-colors"
          >
            ホームページに戻る
          </Link>
        </motion.div>

        {/* イラスト部分 */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.7 }}
          className="mt-12"
        >
          <div className="relative w-full max-w-xs mx-auto">
            <svg
              viewBox="0 0 200 200"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-full h-auto"
            >
              <circle cx="100" cy="100" r="80" fill="#EBF4FF" />
              <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, delay: 1 }}
                d="M65 90C65 77.2975 75.2975 67 88 67H112C124.703 67 135 77.2975 135 90V110C135 122.703 124.703 133 112 133H88C75.2975 133 65 122.703 65 110V90Z"
                stroke="#3B82F6"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.2, delay: 1.3 }}
                d="M65 105C78 115 109 125 135 105"
                stroke="#3B82F6"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <motion.path
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 1.6 }}
                d="M78 85C78 87.7614 75.7614 90 73 90C70.2386 90 68 87.7614 68 85C68 82.2386 70.2386 80 73 80C75.7614 80 78 82.2386 78 85Z"
                fill="#3B82F6"
              />
              <motion.path
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 1.6 }}
                d="M132 85C132 87.7614 129.761 90 127 90C124.239 90 122 87.7614 122 85C122 82.2386 124.239 80 127 80C129.761 80 132 82.2386 132 85Z"
                fill="#3B82F6"
              />
            </svg>
          </div>
        </motion.div>
      </div>

      {/* フッター */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="mt-16 text-sm text-gray-500"
      >
        <p>© {new Date().getFullYear()} Share. すべての権利を保有します。</p>
      </motion.div>
    </div>
  );
}