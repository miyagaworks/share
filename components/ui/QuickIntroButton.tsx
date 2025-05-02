// components/ui/QuickIntroButton.tsx
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { HiSparkles, HiExternalLink } from 'react-icons/hi';

export function QuickIntroButton() {
  return (
    <div className="space-y-2">
      <Link href="/jikogene" target="_blank" rel="noopener noreferrer" className="w-full">
        <Button
          type="button"
          variant="outline"
          className="w-full py-3 group relative flex items-center justify-center bg-blue-700 hover:bg-blue-800"
        >
          <HiSparkles className="mr-2 h-5 w-5 text-yellow-300 animate-pulse" />
          <span className="text-white font-medium">かんたん自己紹介を作成</span>
          <HiExternalLink className="ml-2 h-4 w-4 text-white opacity-70 group-hover:opacity-100 transition-opacity" />
        </Button>
      </Link>
    </div>
  );
}
