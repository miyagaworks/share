// components/shared/ErrorMessage.tsx
import React from 'react';
import { HiExclamation, HiInformationCircle, HiRefresh } from 'react-icons/hi';

type ErrorSeverity = 'error' | 'warning' | 'info';

interface ErrorMessageProps {
  message: string;
  details?: string;
  severity?: ErrorSeverity;
  onRetry?: () => void;
  className?: string;
}

export function ErrorMessage({
  message,
  details,
  severity = 'error',
  onRetry,
  className = '',
}: ErrorMessageProps) {
  // 重要度に応じたスタイル
  const severityStyles = {
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: <HiExclamation className="h-5 w-5 text-red-600" />,
      text: 'text-red-700',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: <HiExclamation className="h-5 w-5 text-yellow-600" />,
      text: 'text-yellow-700',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: <HiInformationCircle className="h-5 w-5 text-blue-600" />,
      text: 'text-blue-700',
    },
  };

  const style = severityStyles[severity];

  return (
    <div className={`${style.bg} ${style.border} border rounded-md p-3 ${className}`}>
      <div className="flex justify-between items-start">
        <div className="flex items-start">
          <div className="flex-shrink-0 mt-0.5 mr-2">{style.icon}</div>
          <div>
            <p className={`text-sm font-medium ${style.text}`}>{message}</p>
            {details && (
              <details className="mt-1">
                <summary className={`text-xs ${style.text} cursor-pointer`}>詳細情報</summary>
                <p className={`mt-1 text-xs ${style.text} whitespace-pre-wrap`}>{details}</p>
              </details>
            )}
          </div>
        </div>

        {onRetry && (
          <button
            onClick={onRetry}
            className={`ml-3 p-1.5 rounded-full hover:bg-opacity-10 hover:bg-gray-500 ${style.text}`}
            aria-label="再試行"
            title="再試行"
          >
            <HiRefresh className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}