// components/ui/Button.tsx (修正版)
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// ボタンバリエーション設定
const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-blue-600 text-white hover:bg-blue-800 focus-visible:ring-blue-500',
        destructive: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
        outline:
          'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus-visible:ring-gray-500',
        secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-500',
        ghost: 'hover:bg-gray-100 text-gray-700 hover:text-gray-900 focus-visible:ring-gray-500',
        link: 'text-blue-600 underline-offset-4 hover:underline focus-visible:ring-blue-500 p-0 h-auto',
        // 🔥 修正: 法人テーマ用のバリアントを修正（!importantを使わない）
        corporate:
          'bg-[#1E3A8A] text-white hover:bg-[#122153] focus-visible:ring-[#1E3A8A] transition-all duration-200',
        corporateOutline:
          'border border-[#1E3A8A] bg-white text-[#1E3A8A] hover:bg-[#1E3A8A]/10 focus-visible:ring-[#1E3A8A] transition-all duration-200',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 px-3 text-xs',
        lg: 'h-11 px-8',
        icon: 'h-10 w-10',
      },
      fullWidth: {
        true: 'w-full',
      },
      loading: {
        true: 'relative',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      fullWidth: false,
      loading: false,
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  icon?: React.ReactNode;
  loadingText?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, fullWidth, loading, children, icon, loadingText, ...props },
    ref,
  ) => {
    // 🔥 修正: 法人バリアント用の追加スタイル処理
    const getCorporateStyles = () => {
      if (variant === 'corporate') {
        return {
          backgroundColor: '#1E3A8A',
          color: 'white',
          borderColor: '#1E3A8A',
        };
      }
      if (variant === 'corporateOutline') {
        return {
          backgroundColor: 'white',
          color: '#1E3A8A',
          borderColor: '#1E3A8A',
        };
      }
      return {};
    };

    return (
      <button
        className={cn(
          buttonVariants({ variant, size, fullWidth, loading }),
          // 🔥 修正: 法人テーマ用の追加クラス
          variant === 'corporate' && 'btn-corporate',
          variant === 'corporateOutline' && 'btn-corporate-outline',
          className,
        )}
        style={getCorporateStyles()}
        ref={ref}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading ? (
          <>
            <span className="absolute inset-0 flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>{loadingText || '読み込み中...'}</span>
            </span>
            <span className="opacity-0">{children}</span>
          </>
        ) : (
          <>
            {icon && <span className="mr-2 corporate-icon">{icon}</span>}
            {children}
          </>
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';

export { Button, buttonVariants };