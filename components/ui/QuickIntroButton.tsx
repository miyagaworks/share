// components/ui/QuickIntroButton.tsx
'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { HiSparkles, HiExternalLink } from 'react-icons/hi';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';

export function QuickIntroButton() {
  const { data: session } = useSession();
  const [isCorporateMember, setIsCorporateMember] = useState(false);

  // セッションからユーザーが法人メンバーかどうかを確認
  useEffect(() => {
    if (session?.user) {
      setIsCorporateMember(!!session.user.tenantId);
    }
  }, [session]);

  return (
    <div className="space-y-2">
      <Link href="/jikogene" target="_blank" rel="noopener noreferrer" className="w-full">
        <Button
          type="button"
          variant={isCorporateMember ? 'corporate' : 'default'}
          className={`
            w-full h-auto min-h-[48px] py-3 px-4 
            group relative flex items-center justify-center 
            text-base sm:text-sm leading-tight whitespace-normal
            ${!isCorporateMember ? 'bg-blue-600 hover:bg-blue-700' : ''}
          `}
        >
          <HiSparkles className="mr-2 h-5 w-5 text-yellow-300 animate-pulse flex-shrink-0" />
          <span className="text-white font-medium text-center">自己紹介文を作成する</span>
          <HiExternalLink className="ml-2 h-4 w-4 text-white opacity-70 group-hover:opacity-100 transition-opacity flex-shrink-0" />
        </Button>
      </Link>
    </div>
  );
}