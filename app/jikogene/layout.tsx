// app/jikogene/layout.tsx
import { validateEnv } from '@/lib/jikogene/env';
import { ToastProvider } from '@/components/providers/ToastProvider';
import SimpleFooter from '@/components/ui/SimpleFooter';
import { Metadata } from 'next';
import { getBrandConfig } from '@/lib/brand/config';
// 環境変数のバリデーション - サーバーコンポーネントで実行される
validateEnv();
const brand = getBrandConfig();
export const metadata: Metadata = {
  title: `自己紹介文ジェネレーター | ${brand.name}`,
  description: 'AIを活用して、最適な自己紹介文を簡単に自動生成できるサービスです。',
};
export default function JikogeneLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ToastProvider />
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="flex-grow">{children}</div>
        <SimpleFooter />
      </div>
    </>
  );
}
