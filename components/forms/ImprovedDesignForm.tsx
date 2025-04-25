// components/forms/ImprovedDesignForm.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EnhancedColorPicker } from '@/components/ui/EnhancedColorPicker';
import { toast } from 'react-hot-toast';
import { updateProfile } from '@/actions/profile';
import { useRouter } from 'next/navigation';
import type { User } from '@prisma/client';
import tinycolor from 'tinycolor2';

// 型拡張
interface ExtendedUser extends User {
  // nullを許容する型として明示的に定義
  snsIconColor: string | null;
  headerText: string | null;
  textColor: string | null;
}

// シンプルなスキーマ
const DesignSchema = z.object({
  mainColor: z.string(),
  snsIconColor: z.string(),
  headerText: z.string().max(38, { message: '最大38文字（全角19文字）までです' }).optional(),
  textColor: z.string().optional(),
});

type FormData = z.infer<typeof DesignSchema>;

interface ImprovedDesignFormProps {
  user: User;
  onUpdate?: () => Promise<void> | void;
}

export function ImprovedDesignForm({ user, onUpdate }: ImprovedDesignFormProps) {
  const extendedUser = user as ExtendedUser;
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useOriginalColors, setUseOriginalColors] = useState(
    extendedUser.snsIconColor === 'original',
  );

  // 定数定義
  const MAX_CHARS = 38; // 最大文字数（半角38文字・全角19文字相当）

  // 状態の追加
  const [remainingChars, setRemainingChars] = useState(MAX_CHARS);

  const {
    handleSubmit,
    setValue,
    register,
    formState: { errors },
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(DesignSchema),
    defaultValues: {
      mainColor: user.mainColor || '#3B82F6',
      snsIconColor: extendedUser.snsIconColor || '#333333',
      headerText: extendedUser.headerText || 'シンプルにつながる、スマートにシェア。',
      textColor: extendedUser.textColor || '#FFFFFF',
    },
  });

  const watchedMainColor = watch('mainColor');
  const watchedSnsIconColor = watch('snsIconColor');
  const watchedHeaderText = watch('headerText');
  const watchedTextColor = watch('textColor');

  // 文字数カウント処理
  useEffect(() => {
    if (watchedHeaderText) {
      // 半角換算でのカウント（全角は2、半角は1としてカウント）
      const count = [...watchedHeaderText].reduce((acc, char) => {
        return acc + (char.match(/[^\x01-\x7E]/) ? 2 : 1);
      }, 0);

      // 残り文字数の計算
      setRemainingChars(MAX_CHARS - count);
    } else {
      setRemainingChars(MAX_CHARS);
    }
  }, [watchedHeaderText]);

  // メインカラーの明度に基づくテキストカラーの推奨
  const isLightMainColor = useMemo(() => {
    const color = tinycolor(watchedMainColor);
    return color.isLight();
  }, [watchedMainColor]);

  // エラーがクリアされたらエラーメッセージをリセット
  useEffect(() => {
    if (errorMessage) {
      setErrorMessage(null);
    }
  }, [watchedMainColor, watchedSnsIconColor, watchedHeaderText, watchedTextColor, errorMessage]);

  // トグルスイッチの変更を処理
  useEffect(() => {
    setValue('snsIconColor', useOriginalColors ? 'original' : '#333333');
  }, [useOriginalColors, setValue]);

  const onSubmit = async (data: FormData) => {
    try {
      setIsPending(true);
      setErrorMessage(null);
      setIsSubmitting(true);

      const response = await updateProfile({
        mainColor: data.mainColor,
        snsIconColor: data.snsIconColor,
        headerText: data.headerText,
        textColor: data.textColor,
      });

      if (response.error) {
        setErrorMessage(response.error);
        throw new Error(response.error);
      }

      toast.success('デザイン設定を更新しました');

      // APIとの同期が終わってからルーター更新
      router.refresh();

      // 更新コールバックを呼び出し
      if (onUpdate) {
        // コールバックを直接呼び出す
        onUpdate();
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(errorMessage || 'デザイン設定の更新に失敗しました');
    } finally {
      setIsPending(false);
      setIsSubmitting(false);
    }
  };

  // カラーピッカーでの色変更処理
  const handleMainColorChange = (color: string) => {
    setValue('mainColor', color);
  };

  // テキストカラーの変更処理
  const handleTextColorChange = (color: string) => {
    setValue('textColor', color);
  };

  // SNSアイコンカラーのトグル切り替え
  const handleSnsIconColorToggle = () => {
    setUseOriginalColors(!useOriginalColors);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            メインカラー
          </label>
          <p className="text-xs text-muted-foreground mt-1 mb-2 text-justify">
            プロフィールページのアクセントカラーとして使用されます
          </p>
          <EnhancedColorPicker
            color={watchedMainColor || '#3B82F6'}
            onChange={handleMainColorChange}
            disabled={isPending}
          />
          {errors.mainColor?.message && (
            <p className="text-sm text-destructive mt-1">{errors.mainColor.message}</p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            ヘッダーテキスト
          </label>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
            <p className="text-xs text-muted-foreground mt-1 mb-2 text-justify">
              公開プロフィールページのヘッダーに表示されるテキスト（全角19文字または半角38文字まで）
            </p>
            <span
              className={`text-xs whitespace-nowrap ${
                remainingChars < 0 ? 'text-red-500 font-bold' : 'text-gray-500'
              }`}
            >
              残り：{remainingChars < 0 ? `-${Math.abs(remainingChars)}` : remainingChars}文字
            </span>
          </div>
          <Input
            {...register('headerText')}
            disabled={isPending}
            placeholder="シンプルにつながる、スマートにシェア。"
          />
          {errors.headerText?.message && (
            <p className="text-sm text-destructive mt-1">{errors.headerText.message}</p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            テキストカラー
          </label>
          <p className="text-xs text-muted-foreground mt-1 mb-2 text-justify">
            ヘッダーテキストと「電話をかける」ボタンのテキストカラー
          </p>
          <EnhancedColorPicker
            color={watchedTextColor || '#FFFFFF'}
            onChange={handleTextColorChange}
            disabled={isPending}
          />
          {isLightMainColor && (
            <div className="mt-2 p-2 rounded-md bg-yellow-50 border border-yellow-200">
              <p className="text-xs text-yellow-700 text-justify">
                メインカラーが明るい時は、テキストの視認性を確保するために濃い色（例:
                #333333）の使用をお勧めします。
              </p>
            </div>
          )}
          {errors.textColor?.message && (
            <p className="text-sm text-destructive mt-1">{errors.textColor.message}</p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            SNSアイコンカラー
          </label>
          <p className="text-xs text-muted-foreground mt-1 mb-2 text-justify">
            SNSアイコンのカラーを設定します
          </p>

          {/* トグルスイッチ */}
          <div className="relative h-14 rounded-md border border-b-black bg-white mt-3">
            <div
              className={`absolute inset-0 flex ${useOriginalColors ? 'justify-end' : 'justify-start'}`}
              onClick={handleSnsIconColorToggle}
            >
              <div className="w-1/2 h-full p-1 cursor-pointer transition-all duration-200">
                <div className="bg-blue-600 w-full h-full rounded-md flex items-center justify-center text-white font-medium">
                  {useOriginalColors ? (
                    <div className="flex items-center">
                      <span className="inline-block w-3 h-3 mr-1 bg-green-500 rounded-full"></span>
                      <span className="inline-block w-3 h-3 mr-1 bg-blue-500 rounded-full"></span>
                      <span className="inline-block w-3 h-3 bg-red-500 rounded-full"></span>
                      <span className="ml-2">カラー</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-gray-800 rounded-full mr-2"></div>
                      <span>シンプル</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="absolute inset-0 flex justify-between pointer-events-none">
              <div className="w-1/2 h-full flex items-center justify-center text-sm text-gray-400">
                <div className="flex items-center opacity-50">
                  <div className="w-4 h-4 bg-gray-400 rounded-full mr-2"></div>
                  <span>シンプル</span>
                </div>
              </div>
              <div className="w-1/2 h-full flex items-center justify-center text-sm text-gray-400">
                <div className="flex items-center opacity-50">
                  <span className="inline-block w-2 h-2 mr-1 bg-green-300 rounded-full"></span>
                  <span className="inline-block w-2 h-2 mr-1 bg-blue-300 rounded-full"></span>
                  <span className="inline-block w-2 h-2 bg-red-300 rounded-full"></span>
                  <span className="ml-2">カラー</span>
                </div>
              </div>
            </div>
          </div>

          {/* SNSアイコンプレビュー */}
          <div className="mt-4">
            <label className="text-xs text-muted-foreground">SNSアイコンプレビュー</label>
            <div className="mt-2 p-4 rounded-lg border border-blue-700 flex justify-center gap-4">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center">
                  <svg
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                    fill={useOriginalColors ? '#00B900' : '#333333'}
                  >
                    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
                  </svg>
                </div>
                <span className="text-xs mt-1">LINE</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center">
                  <svg
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                    fill={useOriginalColors ? '#FF0000' : '#333333'}
                  >
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </div>
                <span className="text-xs mt-1">YouTube</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center">
                  <svg
                    viewBox="0 0 24 24"
                    width="22"
                    height="22"
                    fill={useOriginalColors ? '#000000' : '#333333'}
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </div>
                <span className="text-xs mt-1">X</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center">
                  <svg
                    viewBox="0 0 24 24"
                    width="24"
                    height="24"
                    fill="none"
                    stroke={useOriginalColors ? '#E4405F' : '#333333'}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </div>
                <span className="text-xs mt-1">Instagram</span>
              </div>
            </div>
          </div>

          {errors.snsIconColor?.message && (
            <p className="text-sm text-destructive mt-1">{errors.snsIconColor.message}</p>
          )}
          {errorMessage && <p className="text-sm text-destructive mt-1">{errorMessage}</p>}
        </div>

        {/* 将来的な拡張のためのプレースホルダー */}
        <div className="border-t border-gray-300 pt-4 mt-4">
          <p className="text-sm text-muted-foreground text-justify">
            より高度なカスタマイズオプションは今後のアップデートで追加予定です。
          </p>
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="w-full relative overflow-hidden group">
        <span
          className={`transition-all duration-300 ${isSubmitting ? 'opacity-0' : 'opacity-100'}`}
        >
          {isPending ? '更新中...' : 'デザインを更新'}
        </span>

        {isSubmitting && (
          <span className="absolute inset-0 flex items-center justify-center">
            <svg
              className="animate-spin h-5 w-5 text-white"
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
          </span>
        )}
      </Button>
    </form>
  );
}
