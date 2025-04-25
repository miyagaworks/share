// app/dashboard/design/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Spinner } from '@/components/ui/Spinner';
import { ImprovedDesignForm } from '@/components/forms/ImprovedDesignForm';
import { ImprovedDesignPreview } from '@/components/dashboard/ImprovedDesignPreview'; // ここを変更
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import type { User } from '@prisma/client';
import { HiColorSwatch, HiEye, HiAdjustments } from 'react-icons/hi';

// UserWithProfile型を定義
interface UserWithProfile extends User {
  profile?: {
    id: string;
    userId: string;
    slug: string;
    isPublic: boolean;
    views: number;
    lastAccessed?: Date | null;
    createdAt: Date;
    updatedAt: Date;
  } | null;
}

export default function ImprovedDesignPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserWithProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [shouldScroll, setShouldScroll] = useState(false);

  // ユーザーデータを取得する関数
  const fetchUserData = async (): Promise<UserWithProfile> => {
    try {
      const response = await fetch('/api/profile');

      if (!response.ok) {
        throw new Error('プロフィール情報の取得に失敗しました');
      }

      const data = await response.json();
      return data.user as UserWithProfile;
    } catch (error) {
      console.error('プロフィール取得エラー:', error);
      throw error;
    }
  };

  // データが更新されたときに再取得する関数
  const handleUpdate = async () => {
    try {
      setIsLoading(true);
      const userData = await fetchUserData();
      setUser(userData);

      // モバイルビューでスクロールするようにフラグを設定
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        setShouldScroll(true);
      }
    } catch (error) {
      console.error('データ再取得エラー:', error);
      setError('プロフィール情報の再取得に失敗しました');
      toast.error('プロフィール情報の再取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // スクロールフラグが変更されたらスクロール実行
  useEffect(() => {
    if (shouldScroll && !isLoading) {
      // スクロール実行の遅延を長めに設定
      const timer = setTimeout(() => {
        // プレビュー要素の存在を確認
        if (!previewRef.current) {
          console.warn('プレビュー要素が見つかりません');
          setShouldScroll(false);
          return;
        }

        try {
          // 直接DOM要素を使用してスクロール
          const previewElement = document.getElementById('preview-section');
          if (previewElement) {
            previewElement.scrollIntoView({
              behavior: 'smooth',
              block: 'start',
            });
          } else {
            // プレビューセクションが見つからない場合の代替手段
            window.scrollTo({
              top: window.innerHeight,
              behavior: 'smooth',
            });
          }
        } catch (e) {
          console.error('スクロールエラー:', e);
        }

        // フラグをリセット
        setShouldScroll(false);
      }, 500); // 500msの遅延を設定

      return () => clearTimeout(timer);
    }
  }, [shouldScroll, isLoading]);

  // 初期データ取得
  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/signin');
      return;
    }

    const loadUserData = async () => {
      try {
        const userData = await fetchUserData();
        setUser(userData);
      } catch (error) {
        console.error('データ取得エラー:', error);
        setError('プロフィール情報の取得に失敗しました');
        toast.error('プロフィール情報の取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [session, status, router]);

  const pageVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center mb-6">
          <HiColorSwatch className="h-8 w-8 text-gray-700 mr-3" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">デザイン設定</h1>
            <p className="text-muted-foreground text-justify">
              プロフィールのカラーやデザインをカスタマイズできます
            </p>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <Spinner size="lg" />
            <p className="text-sm text-muted-foreground mt-4">
              プロフィール情報を読み込んでいます...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-6">
        <div className="flex items-center mb-6">
          <HiColorSwatch className="h-8 w-8 text-gray-700 mr-3" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">デザイン設定</h1>
            <p className="text-muted-foreground text-justify">
              プロフィールのカラーやデザインをカスタマイズできます
            </p>
          </div>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-6">
          <p className="text-red-600">
            エラーが発生しました: {error || 'ユーザー情報を取得できませんでした'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-md"
          >
            ページを再読み込み
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={pageVariants}
    >
      <div className="flex items-center mb-6">
        <HiColorSwatch className="h-8 w-8 text-gray-700 mr-3" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">デザイン設定</h1>
          <p className="text-muted-foreground text-justify">
            プロフィールのカラーやデザインをカスタマイズできます
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center mb-4">
            <HiAdjustments className="h-5 w-5 text-gray-700 mr-2" />
            <h2 className="text-xl font-semibold">カラー設定</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6 text-justify">
            プロフィールページに適用されるメインカラーを設定できます
          </p>
          <ImprovedDesignForm user={user} onUpdate={handleUpdate} />
        </motion.div>

        <motion.div
          className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          ref={previewRef}
          id="preview-section"
        >
          <div className="flex items-center mb-4">
            <HiEye className="h-5 w-5 text-gray-700 mr-2" />
            <h2 className="text-xl font-semibold">プレビュー</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-6 text-justify">
            設定したカラーがプロフィールページにどのように表示されるかを確認できます
          </p>
          <ImprovedDesignPreview user={user} />
        </motion.div>
      </div>
    </motion.div>
  );
}
