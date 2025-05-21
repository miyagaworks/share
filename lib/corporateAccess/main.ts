// lib/corporateAccess/main.ts

/**
 * このファイルは新しいモジュール構造への移行ガイドです
 * 既存のcorporateAccessState.tsを段階的に置き換えるための例を示します
 */

/**
 * 移行ステップ1: 既存の呼び出しを新モジュールに置き換える
 *
 * 元のコード:
 *
 * import {
 *   corporateAccessState,
 *   checkCorporateAccess,
 *   isUserCorporateAdmin,
 *   isUserSuperAdmin
 * } from '@/lib/corporateAccess';
 *
 * 新しいコード:
 *
 * import {
 *   corporateAccessState,
 *   checkCorporateAccess,
 *   isUserCorporateAdmin,
 *   isUserSuperAdmin
 * } from '@/lib/corporateAccess';
 */

/**
 * 移行ステップ2: 永久利用権関連の機能を新しいモジュールで活用する
 *
 * 元のコード:
 *
 * import { isPermanentUser, checkPermanentAccess } from '@/lib/corporateAccess';
 *
 * const isPermanent = isPermanentUser();
 * if (isPermanent) {
 *   // 永久利用権ユーザー向けの処理
 * }
 *
 * 新しいコード:
 *
 * import {
 *   checkPermanentAccess,
 *   fetchPermanentPlanType,
 *   PermanentPlanType
 * } from '@/lib/corporateAccess';
 *
 * const isPermanent = checkPermanentAccess();
 * if (isPermanent) {
 *   // プラン種別を取得
 *   const planType = await fetchPermanentPlanType();
 *
 *   if (planType === PermanentPlanType.BUSINESS_PLUS) {
 *     // ビジネスプラス向けの処理
 *   } else if (planType === PermanentPlanType.PERSONAL) {
 *     // 個人プラン向けの処理
 *   }
 * }
 */

/**
 * 移行ステップ3: 仮想テナント機能の使用
 *
 * 元のコード:
 *
 * import {
 *   generateVirtualTenantData,
 *   getVirtualTenantData
 * } from '@/lib/corporateAccess';
 *
 * const tenantData = getVirtualTenantData();
 *
 * 新しいコード:
 *
 * import {
 *   getVirtualTenantData,
 *   getVirtualSnsLinks,
 *   getVirtualDepartments
 * } from '@/lib/corporateAccess';
 *
 * // テナント全体のデータを取得
 * const tenantData = getVirtualTenantData();
 *
 * // または個別の情報だけを取得
 * const snsLinks = getVirtualSnsLinks();
 * const departments = getVirtualDepartments();
 */

/**
 * 移行ステップ4: 状態管理の利用
 *
 * 元のコード:
 *
 * import {
 *   corporateAccessState,
 *   updateCorporateAccessState
 * } from '@/lib/corporateAccess';
 *
 * // 状態を更新
 * updateCorporateAccessState({
 *   hasAccess: true,
 *   isAdmin: true
 * });
 *
 * 新しいコード:
 *
 * import {
 *   corporateAccessState,
 *   updateState
 * } from '@/lib/corporateAccess';
 *
 * // 状態を更新
 * updateState({
 *   hasAccess: true,
 *   isAdmin: true
 * });
 */

/**
 * 移行ステップ5: ストレージ操作の利用
 *
 * 元のコード（明示的なストレージ操作は少ない）:
 *
 * if (typeof localStorage !== 'undefined') {
 *   localStorage.setItem('sns_share_admin_status', isAdmin ? 'true' : 'false');
 * }
 *
 * 新しいコード:
 *
 * import {
 *   saveToStorage,
 *   StorageKey,
 *   StorageType
 * } from '@/lib/corporateAccess';
 *
 * // より堅牢なストレージ操作
 * saveToStorage(StorageKey.ADMIN_STATUS, isAdmin);
 *
 * // または、複雑なデータの場合
 * saveToStorage(
 *   StorageKey.VIRTUAL_TENANT,
 *   tenantData,
 *   StorageType.LOCAL
 * );
 */

/**
 * 移行ステップ6: API通信の利用
 *
 * 元のコード:
 *
 * const result = await checkCorporateAccess(true);
 *
 * 新しいコード:
 *
 * import { checkCorporateAccess } from '@/lib/corporateAccess';
 *
 * // より詳細なオプションを指定可能
 * const result = await checkCorporateAccess({
 *   force: true,
 *   timeout: 5000 // 5秒タイムアウト
 * });
 *
 * // 結果を使用
 * if (result.hasAccess) {
 *   // アクセス権あり
 *   console.log(`テナントID: ${result.tenantId}`);
 *   console.log(`ユーザーロール: ${result.userRole}`);
 * } else if (result.error) {
 *   // エラーがある場合
 *   console.error(`エラー: ${result.error}`);
 * }
 */

/**
 * 移行ステップ7: 初期化処理の利用
 *
 * 元のコード:
 *
 * // クライアントサイドでのみ自動初期化
 * if (typeof window !== 'undefined') {
 *   if (typeof requestAnimationFrame !== 'undefined') {
 *     requestAnimationFrame(() => {
 *       initializeClientState().catch(console.error);
 *     });
 *   } else {
 *     setTimeout(() => {
 *       initializeClientState().catch(console.error);
 *     }, 0);
 *   }
 * }
 *
 * 新しいコード:
 *
 * import { initializeClientState } from '@/lib/corporateAccess';
 *
 * // アプリ開始時に一度だけ呼び出す（必要な場合のみ）
 * // 通常は自動初期化されるので明示的な呼び出しは不要
 * useEffect(() => {
 *   initializeClientState().catch(console.error);
 * }, []);
 */

/**
 * サンプル実装: コンポーネント内での使用例
 */

/*
import { useEffect, useState } from 'react';
import { 
  corporateAccessState, 
  checkCorporateAccess,
  checkPermanentAccess,
  PermanentPlanType,
  fetchPermanentPlanType,
  isUserCorporateAdmin
} from '@/lib/corporateAccess';

function CorporateAccessComponent() {
  const [accessChecked, setAccessChecked] = useState(false);
  const [isPermanent, setIsPermanent] = useState(false);
  const [planType, setPlanType] = useState<PermanentPlanType | null>(null);

  useEffect(() => {
    async function checkAccess() {
      // 永久利用権チェック（同期的）
      const hasPermanentAccess = checkPermanentAccess();
      setIsPermanent(hasPermanentAccess);
      
      if (hasPermanentAccess) {
        // 永久利用権ユーザーの場合はプラン種別を取得
        const type = await fetchPermanentPlanType();
        setPlanType(type);
      } else {
        // 通常の法人アクセス権チェック
        await checkCorporateAccess({ force: true });
      }
      
      setAccessChecked(true);
    }
    
    checkAccess();
  }, []);
  
  if (!accessChecked) {
    return <div>アクセス権を確認中...</div>;
  }
  
  // 永久利用権ユーザーの場合
  if (isPermanent) {
    return (
      <div>
        <h2>永久利用権ユーザー</h2>
        <p>プラン種別: {planType}</p>
      </div>
    );
  }
  
  // 法人アクセス権がある場合
  if (corporateAccessState.hasAccess) {
    return (
      <div>
        <h2>法人アクセス権あり</h2>
        <p>テナントID: {corporateAccessState.tenantId}</p>
        <p>ユーザーロール: {corporateAccessState.userRole}</p>
        <p>管理者権限: {isUserCorporateAdmin() ? 'あり' : 'なし'}</p>
      </div>
    );
  }
  
  // アクセス権がない場合
  return (
    <div>
      <h2>法人アクセス権なし</h2>
      {corporateAccessState.error && (
        <p>エラー: {corporateAccessState.error}</p>
      )}
    </div>
  );
}
*/

// 移行作業用の修正対象ファイル一覧
/**
 * 優先順位の高いファイル:
 *
 * 1. lib/corporateAccessState.ts - 既存ファイルを削除して新モジュールに置き換え
 * 2. components/guards/CorporateAccessGuard.tsx - アクセス制御を新モジュールで実装
 * 3. app/dashboard/layout.tsx - メニュー表示ロジックを新モジュールで実装
 * 4. components/guards/CorporateMemberGuard.tsx - メンバーアクセス制御を新モジュールで実装
 * 5. components/subscription/SubscriptionStatus.tsx - 永久利用権表示を新モジュールで実装
 *
 * 次の優先順位:
 *
 * 6. app/dashboard/subscription/page.tsx - ご利用プラン画面を新モジュールで実装
 * 7. app/api/admin/grant-permanent/route.ts - 永久利用権付与APIを新モジュールで実装
 * 8. app/api/user/permanent-plan-type/route.ts - プラン種別取得APIを新モジュールで実装
 * 9. app/api/subscription/create/route.ts - プラン変更制限を新モジュールで実装
 * 10. app/api/subscription/route.ts - ご利用プラン情報取得APIを新モジュールで実装
 *
 * その他の影響ファイル:
 *
 * - components/admin/GrantPermanentAccess.tsx - 管理者機能
 * - middleware/permanentAccessHandler.ts - 永久利用権ミドルウェア
 * - lib/utils/admin-access.ts - 管理者権限機能
 */