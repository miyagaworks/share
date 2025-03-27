// components/profile/ProfileCustomLink.tsx
import type { CustomLink } from "@prisma/client";

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
            className="flex items-center p-3 rounded-md bg-muted hover:bg-muted/80 transition-colors"
        >
            <div
                className="w-6 h-6 mr-3 flex items-center justify-center"
                style={{ color: mainColor }}
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                </svg>
            </div>
            <span>{link.name}</span>
        </a>
    );
}