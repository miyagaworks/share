// components/guards/CorporateMemberGuard.tsx
import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  checkCorporateAccess,
  PermanentPlanType,
  checkPermanentAccess,
  fetchPermanentPlanType,
} from '@/lib/corporateAccess';
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
        // まず永久利用権ユーザーかどうかを確認
        const isPermanent = checkPermanentAccess();

        if (isPermanent) {
          // 永久利用権ユーザーの場合、プラン種別を取得
          const planType = await fetchPermanentPlanType();

          // 個人プランの場合はアクセス拒否
          if (planType === PermanentPlanType.PERSONAL) {
            console.log('個人プラン永久利用権ユーザーのため法人メンバーアクセス拒否');
            setHasAccess(false);
            setError('個人永久プランでは法人機能にアクセスできません');
            // リダイレクト
            setTimeout(() => {
              router.push('/dashboard');
            }, 1000);
            setIsChecking(false);
            return;
          } else {
            // 法人プランの永久利用権ユーザーはアクセス許可
            console.log('法人プラン永久利用権ユーザーに法人メンバーアクセス権を付与');
            setHasAccess(true);
            setIsChecking(false);
            return;
          }
        }

        // APIを呼び出して最新の法人アクセス権を確認（キャッシュを使わない）
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
            setError('法人メンバー機能へのアクセス権がありません');
            router.push('/dashboard');
          }
        }
      } catch (error) {
        console.error('アクセス権確認エラー:', error);
        setError('法人メンバーアクセスの確認中にエラーが発生しました。');
        setHasAccess(false);

        // エラー発生時も個人ダッシュボードにリダイレクト
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000); // エラーメッセージを表示する時間を確保
      } finally {
        setIsChecking(false);
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
      {error && <p className="text-yellow-600 mt-2">{error}</p>}
    </div>
  );
}