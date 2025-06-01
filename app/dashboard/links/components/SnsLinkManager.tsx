// app/dashboard/links/components/SnsLinkManager.tsx
'use client';
import { useState } from 'react';
import { ImprovedSnsLinkList } from '@/components/dashboard/ImprovedSnsLinkList';
import type { SnsLink } from '@prisma/client';
interface SnsLinkManagerProps {
  links: SnsLink[];
  onEditCallback?: (id: string) => void; // カスタムコールバック（オプショナル）
}
export function SnsLinkManager({ links, onEditCallback }: SnsLinkManagerProps) {
  const [key, setKey] = useState('0');
  const handleUpdate = () => {
    // キーを変更して強制的に再レンダリング
    setKey((prev) => String(Number(prev) + 1));
  };
  // 編集処理
  const handleEdit = (id: string) => {
    // カスタムコールバックがあれば実行、なければデフォルト動作
    if (onEditCallback) {
      onEditCallback(id);
    } else {
      // ダイアログを開くなどのデフォルト動作
    }
  };
  return (
    <ImprovedSnsLinkList key={key} links={links} onUpdate={handleUpdate} onEdit={handleEdit} />
  );
}