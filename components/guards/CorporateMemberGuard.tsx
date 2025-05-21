// components/guards/CorporateMemberGuard.tsx
import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { checkCorporateAccess } from '@/lib/corporateAccess';
import { Spinner } from '@/components/ui/Spinner';

export function CorporateMemberGuard({ children }: { children: ReactNode }) {
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false); // hasAccess状態を追加
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    // セッションがロード中なら待機
    if (status === 'loading') return;

    const verifyAccess = async () => {
      try {
        // APIを呼び出して最新の法人アクセス権を確認（キャッシュを使わない）
        // 修正: boolean 型から { force: boolean } 型へ変更
        const result = await checkCorporateAccess({ force: true });

        // アクセス権があるかどうかを明示的に確認
        if (result.hasAccess === true) {
          console.log('法人メンバーアクセス権を確認しました');
          setHasAccess(true);
          setIsChecking(false);
        } else {
          // ここで重要な修正: userRoleがmemberでもアクセスを許可する
          if (result.userRole === 'member' || result.userRole === 'admin') {
            console.log('メンバーまたは管理者としてアクセス権を付与します');
            setHasAccess(true);
            setIsChecking(false);
          } else {
            console.log(
              '個人プランユーザーを検出しました。個人ダッシュボードへリダイレクトします。',
            );
            router.push('/dashboard');
          }
        }
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

  // アクセス権があれば子コンポーネントを表示
  if (hasAccess) {
    return <>{children}</>;
  }

  // アクセス権がなければ何も表示せず、リダイレクト処理を待つ
  return (
    <div className="flex flex-col justify-center items-center p-8">
      <p className="text-red-500">アクセス権がありません。リダイレクトします...</p>
    </div>
  );
}