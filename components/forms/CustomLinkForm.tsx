// components/forms/CustomLinkForm.tsx (修正版 - ボタン間隔統一)
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

  const onSubmit = async (data: FormData) => {
    if (isPending) return;

    try {
      setIsPending(true);

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
        } catch (err) {
          // JSON解析エラーは無視
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'カスタムリンクの追加に失敗しました');
      }

      reset();
      onSuccess();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'カスタムリンクの追加に失敗しました';
      toast.error(errorMessage);
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

      {/* 🚀 修正: mb-2を追加してキャンセルボタンとの間隔を統一 */}
      <div className="flex justify-center mb-2">
        <Button
          type="submit"
          disabled={isPending}
          className="w-full max-w-xs min-h-[48px] md:min-h-0 text-base md:text-sm"
        >
          {isPending ? (
            <div className="flex items-center">
              <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2" />
              追加中...
            </div>
          ) : (
            'カスタムリンクを追加'
          )}
        </Button>
      </div>
    </form>
  );
}