// components/dashboard/SnsLinkDisplay.tsx
'use client';

import { useState } from 'react';
import { ImprovedSnsLinkList } from '@/components/dashboard/ImprovedSnsLinkList';
import type { SnsLink } from '@prisma/client';

interface SnsLinkDisplayProps {
  links: SnsLink[];
  onEdit?: (id: string) => void; // オプショナルにする
}

export default function SnsLinkDisplay({ links, onEdit }: SnsLinkDisplayProps) {
  const [key, setKey] = useState('0');

  const handleUpdate = () => {
    // キーを変更して強制的に再レンダリング
    setKey((prev) => String(Number(prev) + 1));
  };

  // デフォルトのonEdit関数を提供
  const defaultOnEdit = (id: string) => {
    console.log(`Edit requested for link: ${id}`);
  };

  return (
    <ImprovedSnsLinkList
      key={key}
      links={links}
      onUpdate={handleUpdate}
      onEdit={onEdit || defaultOnEdit} // デフォルト値を提供
    />
  );
}