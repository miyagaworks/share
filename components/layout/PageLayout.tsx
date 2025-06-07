// components/layout/PageLayout.tsx - フッター統合版
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { Footer } from '@/components/layout/Footer';
import { MobileFooter } from '@/components/layout/MobileFooter';
import { Header } from '@/components/layout/Header';

type BreadcrumbItem = {
  name: string;
  href: string;
};

type PageLayoutProps = {
  title: string;
  breadcrumbs: BreadcrumbItem[];
  children: React.ReactNode;
};

export function PageLayout({ title, breadcrumbs, children }: PageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />

      <main className="flex-grow pt-22">
        <div className="container mx-auto px-4">
          <Breadcrumb items={breadcrumbs} />
          <h1 className="text-3xl font-bold my-6 text-justify">{title}</h1>
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8 pb-16 md:pb-6">{children}</div>
        </div>
      </main>

      {/* デスクトップ用フッター */}
      <div className="hidden md:block">
        <Footer />
      </div>

      {/* モバイル専用フッター */}
      <MobileFooter />
    </div>
  );
}