// app/dashboard/links/components/SnsLinkClientWrapper.tsx
'use client';

import { useState } from 'react';
import { ImprovedSnsLinkList } from '@/components/dashboard/ImprovedSnsLinkList';
import type { SnsLink } from '@prisma/client';

interface SnsLinkClientWrapperProps {
  links: SnsLink[];
}

export function SnsLinkClientWrapper({ links }: SnsLinkClientWrapperProps) {
  const [key, setKey] = useState('0');

  const handleUpdate = () => {
    // キーを変更して強制的に再レンダリング
    setKey((prev) => String(Number(prev) + 1));
  };

  // onEdit プロパティを追加
  const handleEdit = (id: string) => {
    console.log(`Editing link with ID: ${id}`);
    // 必要に応じて編集ロジックを実装
  };

  return (
    <ImprovedSnsLinkList
      key={key}
      links={links}
      onUpdate={handleUpdate}
      onEdit={handleEdit} // onEditプロパティを追加
    />
  );
}