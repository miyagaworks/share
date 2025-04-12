// app/dashboard/corporate/settings/layout.tsx
import { ReactNode } from 'react';

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ここにレイアウトに関する追加スタイルや構造を定義できます */}
      <div className="container mx-auto py-6 px-4 lg:px-8">{children}</div>
    </div>
  );
}