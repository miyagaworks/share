// components/guards/CorporateMemberGuard.tsx
import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  checkCorporateAccess,
  PermanentPlanType,
  checkPermanentAccess,
  fetchPermanentPlanType,
  updateState,
} from '@/lib/corporateAccess';
import { Spinner } from '@/components/ui/Spinner';

export function CorporateMemberGuard({ children }: { children: ReactNode }) {
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    // セッションがロード中なら待機
    if (status === 'loading') return;

    const verifyAccess = async () => {
      try {
        console.log('[CorporateMemberGuard] アクセス権検証開始');

        // まず永久利用権ユーザーかどうかを確認
        const isPermanent = checkPermanentAccess();

        if (isPermanent) {
          console.log('[CorporateMemberGuard] 永久利用権ユーザーを検出');
          // 永久利用権ユーザーの場合、プラン種別を取得
          const planType = await fetchPermanentPlanType();

          // 個人プランの場合はアクセス拒否
          if (planType === PermanentPlanType.PERSONAL) {
            console.log('[CorporateMemberGuard] 個人プラン - アクセス拒否');
            setHasAccess(false);
            setError('個人永久プランでは法人機能にアクセスできません');
            setTimeout(() => router.push('/dashboard'), 1000);
            setIsChecking(false);
            return;
          } else {
            console.log('[CorporateMemberGuard] 法人プラン - アクセス許可');
            // 法人プランの永久利用権ユーザーはアクセス許可
            // 状態も更新して他のコンポーネントでも使用可能に
            updateState({
              hasAccess: true,
              isAdmin: true,
              tenantId: `virtual-tenant-${Date.now()}`,
              userRole: 'admin',
              isPermanentUser: true,
              permanentPlanType: planType,
            });
            setHasAccess(true);
            setIsChecking(false);
            return;
          }
        }

        // 通常ユーザーの場合：APIを呼び出して最新の法人アクセス権を確認
        console.log('[CorporateMemberGuard] 通常ユーザー - API チェック');
        const result = await checkCorporateAccess({ force: true });

        console.log('[CorporateMemberGuard] API結果:', result);

        // アクセス権の判定（より柔軟に）
        const shouldHaveAccess =
          result.hasCorporateAccess === true ||
          result.userRole === 'member' ||
          result.userRole === 'admin';

        if (shouldHaveAccess) {
          console.log('[CorporateMemberGuard] アクセス権付与');
          setHasAccess(true);
        } else {
          console.log('[CorporateMemberGuard] アクセス権なし - リダイレクト');
          setError('法人メンバー機能へのアクセス権がありません');
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('[CorporateMemberGuard] エラー:', error);
        setError('法人メンバーアクセスの確認中にエラーが発生しました。');
        setHasAccess(false);
        setTimeout(() => router.push('/dashboard'), 2000);
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