// components/shared/Breadcrumb.tsx
import Link from 'next/link';

type BreadcrumbItem = {
  name: string;
  href: string;
};

type BreadcrumbProps = {
  items: BreadcrumbItem[];
};

export function Breadcrumb({ items }: BreadcrumbProps) {
  // ホームのリンク先を/dashboardに変更
  const updatedItems = items.map((item) => {
    if (item.name === 'ホーム' && item.href === '/') {
      return { ...item, href: '/dashboard' };
    }
    return item;
  });

  return (
    <nav className="py-4" aria-label="パンくずリスト">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        {updatedItems.map((item, index) => (
          <li key={item.href} className="inline-flex items-center">
            {index > 0 && (
              <svg
                className="w-3 h-3 mx-2 text-gray-400"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 6 10"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M1 9l4-4-4-4"
                />
              </svg>
            )}
            {index === updatedItems.length - 1 ? (
              <span className="text-sm font-medium text-gray-500">{item.name}</span>
            ) : (
              <Link
                href={item.href}
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                {item.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
