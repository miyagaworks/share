// components/ui/QuickIntroButton.tsx
import React from 'react';
import Link from 'next/link';
import { HiLightningBolt } from 'react-icons/hi';

interface QuickIntroButtonProps {
  className?: string;
}

export const QuickIntroButton: React.FC<QuickIntroButtonProps> = ({ className = '' }) => {
  return (
    <Link href="/jikogene?fromProfile=true" passHref target="_blank" rel="noopener noreferrer">
      <button
        type="button"
        className={`
          inline-flex items-center text-sm px-4 py-2 border border-blue-500 
          rounded-md text-blue-600 bg-white hover:bg-blue-50 
          transition-colors duration-200 font-medium
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          ${className}
        `}
      >
        <HiLightningBolt className="mr-2 h-5 w-5 text-blue-500" />
        かんたん自己紹介を作成
      </button>
    </Link>
  );
};

export default QuickIntroButton;
