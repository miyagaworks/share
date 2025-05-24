// components/ui/OptimizedMenuCard.tsx
import React, { memo, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';

type CardColor = 'blue' | 'green' | 'indigo' | 'purple' | 'gray';

interface OptimizedMenuCardProps {
  icon: React.ReactNode;
  title: string;
  content: string | number | React.ReactNode;
  onClick: () => void;
  color?: CardColor;
  className?: string;
}

// カラーマップをコンポーネント外で定義（再作成を防ぐ）
const colorMap: Record<CardColor, { bg: string; text: string; iconBg: string }> = {
  blue: {
    bg: 'bg-blue-100',
    text: 'text-blue-600',
    iconBg: 'bg-blue-50',
  },
  green: {
    bg: 'bg-green-100',
    text: 'text-green-600',
    iconBg: 'bg-green-50',
  },
  indigo: {
    bg: 'bg-indigo-100',
    text: 'text-indigo-600',
    iconBg: 'bg-indigo-50',
  },
  purple: {
    bg: 'bg-purple-100',
    text: 'text-purple-600',
    iconBg: 'bg-purple-50',
  },
  gray: {
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    iconBg: 'bg-gray-50',
  },
};

export const OptimizedMenuCard = memo<OptimizedMenuCardProps>(
  ({ icon, title, content, onClick, color = 'blue', className }) => {
    // カラースタイルをメモ化
    const colorStyles = useMemo(() => colorMap[color], [color]);

    // クリックハンドラーをメモ化
    const handleClick = useCallback(() => {
      onClick();
    }, [onClick]);

    // クラス名をメモ化
    const cardClasses = useMemo(
      () =>
        cn(
          'bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden cursor-pointer',
          'transform transition-all duration-200 hover:-translate-y-1 hover:shadow-md',
          className,
        ),
      [className],
    );

    const headerClasses = useMemo(
      () => cn('border-b border-gray-200 px-2 sm:px-4 py-2 sm:py-3 bg-opacity-30', colorStyles.bg),
      [colorStyles.bg],
    );

    const iconContainerClasses = useMemo(
      () =>
        cn('p-2 sm:p-3 rounded-full mb-2 sm:mb-3 flex items-center justify-center', colorStyles.bg),
      [colorStyles.bg],
    );

    const iconClasses = useMemo(
      () => cn('h-5 w-5 sm:h-6 sm:w-6 flex items-center justify-center', colorStyles.text),
      [colorStyles.text],
    );

    return (
      <div className={cardClasses} onClick={handleClick}>
        <div className={headerClasses}>
          <div className="flex items-center">
            <div className={colorStyles.text}>{icon}</div>
            <h2 className="ml-2 text-sm sm:text-base font-semibold truncate">{title}</h2>
          </div>
        </div>
        <div className="p-2 sm:p-4">
          <div className="flex flex-col items-center">
            <div className={iconContainerClasses}>
              <div className={iconClasses}>{icon}</div>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 text-center">{content}</p>
          </div>
        </div>
      </div>
    );
  },
);

OptimizedMenuCard.displayName = 'OptimizedMenuCard';