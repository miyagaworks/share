// app/jikogene/components/Result.tsx
'use client';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { memo } from 'react';
interface ResultProps {
  text: string;
  onReset: () => void;
  warning?: string;
}
/**
 * 生成された自己紹介文を表示するコンポーネント
 * ボタンの縦幅を調整して、スマホでも見やすく
 */
const Result = memo(function Result({ text, onReset, warning }: ResultProps) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('クリップボードにコピーしました');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('コピーに失敗しました');
      // クリップボードコピーエラーは既にtoastで通知済み
    }
  };
  return (
    <div className="max-w-3xl mx-auto animate-fadeIn">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-center">自己紹介文が完成しました！</CardTitle>
        </CardHeader>
        {/* 警告メッセージがある場合に表示 */}
        {warning && (
          <div className="mx-6 mb-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">{warning}</p>
              </div>
            </div>
          </div>
        )}
        <CardContent>
          <div className="bg-gray-50 p-6 rounded-md border border-gray-200 mb-6">
            <p className="whitespace-pre-line text-gray-800 text-justify">{text}</p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4 py-6">
          <Button
            onClick={handleCopy}
            className="flex items-center justify-center w-full sm:w-auto py-3 sm:py-2 px-6"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
              <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
            </svg>
            {copied ? 'コピーしました！' : 'テキストをコピー'}
          </Button>
          <Button
            variant="outline"
            onClick={onReset}
            className="flex items-center justify-center w-full sm:w-auto py-3 sm:py-2 px-6"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                clipRule="evenodd"
              />
            </svg>
            他の自己紹介文を作成
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
});
export default Result;
