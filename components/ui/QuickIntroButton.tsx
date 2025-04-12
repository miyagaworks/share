// components/ui/QuickIntroButton.tsx
import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { HiSparkles, HiExternalLink } from 'react-icons/hi';

export function QuickIntroButton() {
  const router = useRouter();

  const handleClick = () => {
    router.push('/jikogene');
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="default" // defaultに変更してプライマリカラーに
        onClick={handleClick}
        className="w-full py-3 group relative flex items-center justify-center bg-blue-600 hover:bg-blue-700"
      >
        <HiSparkles className="mr-2 h-5 w-5 text-yellow-300 animate-pulse" />
        <span className="text-white font-medium">かんたん自己紹介を作成</span>
        <HiExternalLink className="ml-2 h-4 w-4 text-white opacity-70 group-hover:opacity-100 transition-opacity" />
      </Button>

      <p className="text-sm text-gray-600 px-2 text-justify">
        AI支援の質問に答えるだけで、あなたに最適化された自己紹介文を簡単に作成できます。
        職業、趣味、性格などの情報から魅力的な自己紹介を自動生成します。
      </p>
    </div>
  );
}
