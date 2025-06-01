// hooks/useOptimizedProfile.ts
import { useQuery } from '@tanstack/react-query';
export function useOptimizedProfile(userId?: string) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const response = await fetch(`/api/profile?userId=${userId}`);
      if (!response.ok) {
        throw new Error('プロフィールデータの取得に失敗しました');
      }
      return response.json();
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10分間フレッシュ
  });
}