// components/layout/PageLayout.tsx
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { Footer } from '@/components/layout/Footer';
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
        {' '}
        <div className="container mx-auto px-4">
          <Breadcrumb items={breadcrumbs} />
          <h1 className="text-3xl font-bold my-6 text-justify">{title}</h1>
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">{children}</div>
        </div>
      </main>
      {/* サービス情報セクションを削除（フッターに既に表示されているため） */}
      <Footer />
    </div>
  );
}