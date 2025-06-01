// components/forms/CustomLinkForm.tsx (修正版 - API Route対応 - 完全版)
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'react-hot-toast';

const CustomLinkSchema = z.object({
  name: z.string().min(1, { message: 'リンク名を入力してください' }),
  url: z.string().url({ message: '有効なURLを入力してください' }),
});

type FormData = z.infer<typeof CustomLinkSchema>;

interface CustomLinkFormProps {
  onSuccess: () => void;
}

export function CustomLinkForm({ onSuccess }: CustomLinkFormProps) {
  const [isPending, setIsPending] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(CustomLinkSchema),
    defaultValues: {
      name: '',
      url: 'https://',
    },
  });

  // 🚀 修正: API Route経由でカスタムリンクを追加
  const onSubmit = async (data: FormData) => {
    if (isPending) return; // 重複送信防止

    try {
      setIsPending(true);

      // 🔥 重要: Server ActionではなくAPI Routeを使用
      const response = await fetch('/api/links/custom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          url: data.url,
        }),
      });

      if (!response.ok) {
        const responseText = await response.text();
        let errorMessage = 'カスタムリンクの追加に失敗しました';

        try {
          const errorData = JSON.parse(responseText);
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch {
          console.error('API返却値が不正なフォーマット:', responseText);
        }

        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'カスタムリンクの追加に失敗しました');
      }

      // 🚀 成功時の処理
      console.log('✅ カスタムリンク追加成功:', result.customLink);

      // フォームをリセット
      reset();

      // 成功コールバックを呼び出し（親コンポーネントで状態更新）
      onSuccess();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'カスタムリンクの追加に失敗しました';
      toast.error(errorMessage);
      console.error('カスタムリンク追加エラー:', error);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Input
            label="リンク名"
            placeholder="ポートフォリオ"
            {...register('name')}
            error={errors.name?.message}
            disabled={isPending}
          />
        </div>

        <div>
          <Input
            label="URL"
            placeholder="https://example.com"
            {...register('url')}
            error={errors.url?.message}
            disabled={isPending}
          />
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? (
          <div className="flex items-center">
            <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2" />
            追加中...
          </div>
        ) : (
          'カスタムリンクを追加'
        )}
      </Button>
    </form>
  );
}