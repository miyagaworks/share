// hooks/useCorporateData.ts
import { useState, useEffect } from 'react';
import {
  checkPermanentAccess,
  getVirtualTenantData,
} from '@/lib/corporateAccess';
export function useCorporateData<T>(apiEndpoint: string, defaultData: T) {
  const [data, setData] = useState<T>(defaultData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        // 永久利用権ユーザーかどうかをチェック
        const isPermanent = checkPermanentAccess();
        if (isPermanent) {
          // 仮想テナントデータを取得
          const virtualData = getVirtualTenantData();
          if (!virtualData) {
            throw new Error('仮想テナントデータの取得に失敗しました');
          }
          // APIエンドポイントに基づいて適切な仮想データを返す
          let responseData: unknown;
          if (apiEndpoint.includes('/sns')) {
            responseData = { success: true, snsLinks: virtualData.snsLinks, isAdmin: true };
          } else if (apiEndpoint.includes('/departments')) {
            responseData = { success: true, departments: virtualData.departments };
          } else if (apiEndpoint.includes('/users')) {
            responseData = { success: true, users: virtualData.users };
          } else if (apiEndpoint.includes('/branding')) {
            responseData = { success: true, settings: virtualData.settings };
          } else if (apiEndpoint.includes('/tenant')) {
            responseData = {
              success: true,
              tenant: {
                id: virtualData.id,
                name: virtualData.name,
                ...virtualData.settings,
              },
            };
          }
          setData(responseData as T);
          setIsLoading(false);
          return;
        }
        // 通常の法人ユーザーの場合はAPIリクエストを実行
        const response = await fetch(apiEndpoint);
        if (!response.ok) {
          throw new Error(`APIリクエストエラー: ${response.status}`);
        }
        const responseData = await response.json();
        setData(responseData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [apiEndpoint]);
  return { data, isLoading, error };
}