// components/profile/ProfileCustomLink.tsx
import type { CustomLink } from '@prisma/client';

interface ProfileCustomLinkProps {
  link: CustomLink;
  mainColor: string;
}

export function ProfileCustomLink({ link, mainColor }: ProfileCustomLinkProps) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between py-2 px-4 mb-2 rounded-4xl bg-white border border-gray-100 shadow-sm hover:shadow hover:translate-y-[-1px] transition-all duration-200"
    >
      {/* 左側のコンテンツエリア */}
      <div className="flex items-center">
        <div
          className="w-8 h-8 mr-3 flex-shrink-0 rounded-full flex items-center justify-center"
          style={{ backgroundColor: mainColor }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
          </svg>
        </div>
        <div className="overflow-hidden">
          <p className="text-sm font-medium text-gray-800 truncate">{link.name}</p>
        </div>
      </div>
      {/* 右側の矢印アイコン */}
      <div className="text-gray-400 flex-shrink-0 ml-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="5" y1="12" x2="19" y2="12"></line>
          <polyline points="12 5 19 12 12 19"></polyline>
        </svg>
      </div>
    </a>
  );
}