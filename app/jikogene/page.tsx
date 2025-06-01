// app/jikogene/page.tsx
'use client';
import { Suspense } from 'react';
import JikogeneContent from './components/JikogeneContent';
export default function JikogenePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center">
          <p className="text-gray-700">読み込み中...</p>
        </div>
      }
    >
      <JikogeneContent />
    </Suspense>
  );
}