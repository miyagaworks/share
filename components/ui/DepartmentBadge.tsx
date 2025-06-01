// components/ui/DepartmentBadge.tsx
import React from 'react';
import { HiOfficeBuilding } from 'react-icons/hi';
interface DepartmentBadgeProps {
  departmentName: string;
  position?: string | null;
  primaryColor?: string;
  small?: boolean;
}
export function DepartmentBadge({
  departmentName,
  position = null,
  primaryColor = 'var(--color-corporate-primary)',
  small = false,
}: DepartmentBadgeProps) {
  // 背景色は primaryColor の薄いバージョン
  const bgColor = `${primaryColor}15`; // 15% の透明度
  // テキスト色は primaryColor
  const textColor = primaryColor;
  // バッジのサイズを調整
  const baseClasses = 'flex items-center rounded-full';
  const sizeClasses = small ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  const badgeClasses = `${baseClasses} ${sizeClasses}`;
  return (
    <div className={badgeClasses} style={{ backgroundColor: bgColor, color: textColor }}>
      <HiOfficeBuilding className={small ? 'mr-1 h-3 w-3' : 'mr-2 h-4 w-4'} />
      <span>
        {departmentName}
        {position && ` / ${position}`}
      </span>
    </div>
  );
}