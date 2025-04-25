// app/dashboard/corporate/debug/page.tsx

'use client';

// import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

export default function CorporateDebugPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">法人アクセス診断ツール</h1>
        <Button variant="outline" onClick={() => router.back()}>
          ダッシュボードに戻る
        </Button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-blue-800">
          このページは開発者向けのデバッグツールです。法人アクセス権に関する問題を診断し、解決策を提案します。
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-medium mb-4">診断ツール</h2>
        <p className="mb-4">
          APIエンドポイント:{' '}
          <code className="bg-gray-100 p-1 rounded">/api/debug/corporate-detailed</code>
        </p>
        <Button
          onClick={() => {
            window.open('/api/debug/corporate-detailed', '_blank');
          }}
        >
          診断APIを実行
        </Button>
      </div>
    </div>
  );
}