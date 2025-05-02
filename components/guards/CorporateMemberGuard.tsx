// components/guards/CorporateMemberGuard.tsx
import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { checkCorporateAccess } from '@/lib/corporateAccessState'; // corporateAccessStateのインポートを削除
import { Spinner } from '@/components/ui/Spinner';

export function CorporateMemberGuard({ children }: { children: ReactNode }) {
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // hasAccess状態変数は実際に使用しないので削除
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    // セッションがロード中なら待機
    if (status === 'loading') return;

    const verifyAccess = async () => {
      try {
        // APIを呼び出して最新の法人アクセス権を確認（キャッシュを使わない）
        const result = await checkCorporateAccess(true);

        // 個人プランユーザーの場合、自動的に個人ダッシュボードへリダイレクト
        if (!result.hasAccess) {
          console.log('個人プランユーザーを検出しました。個人ダッシュボードへリダイレクトします。');
          router.push('/dashboard');
          return;
        }

        // ここでhasAccessを設定するのではなく、単純にチェックを完了
        setIsChecking(false);
      } catch (error) {
        console.error('アクセス権確認エラー:', error);
        setError('法人メンバーアクセスの確認中にエラーが発生しました。');

        // エラー発生時も個人ダッシュボードにリダイレクト
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000); // エラーメッセージを表示する時間を確保
      }
    };

    verifyAccess();
  }, [router, status]);

  if (isChecking) {
    return (
      <div className="flex flex-col justify-center items-center p-8">
        <Spinner size="lg" />
        <span className="ml-3 text-gray-500 mt-4">アクセス権を確認中...</span>
        {error && <p className="text-red-500 mt-2">{error}</p>}
      </div>
    );
  }

  return <>{children}</>;
}