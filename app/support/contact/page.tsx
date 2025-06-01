// app/support/contact/page.tsx
'use client';
import { Suspense } from 'react';
import ContactPageContent from './ContactPageContent';
export default function ContactPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        </div>
      }
    >
      <ContactPageContent />
    </Suspense>
  );
}