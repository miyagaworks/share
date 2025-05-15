// app/qrcode/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Spinner } from '@/components/ui/Spinner';
import { QrCodeGenerator } from '@/components/qrcode/QrCodeGenerator';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';

export default function QrCodePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user) {
      router.push('/auth/signin');
      return;
    }

    // プロフィールの存在を確認する関数
    const checkProfileExists = async () => {
      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const data = await response.json();
          if (!data?.user?.profile) {
            // プロフィールが存在しない場合
            toast.error('プロフィールが必要です。プロフィール設定を完了してください。');
            router.push('/dashboard/profile');
            return;
          }
          // 読み込み完了
          setIsLoading(false);
        } else {
          // APIエラー処理
          toast.error('プロフィール情報の取得に失敗しました');
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Profile check error:', error);
        toast.error('エラーが発生しました。再度お試しください。');
        setIsLoading(false);
      }
    };

    checkProfileExists();
  }, [session, status, router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Link
          href="/dashboard/share"
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <FaArrowLeft className="mr-2" />
          共有設定に戻る
        </Link>
      </div>

      <QrCodeGenerator />
    </div>
  );
}