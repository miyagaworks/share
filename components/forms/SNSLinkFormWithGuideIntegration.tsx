// components/forms/SNSLinkFormWithGuideIntegration.tsx (修正版 - API Route対応)
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'react-hot-toast';
import { ImprovedSnsIcon } from '@/components/shared/ImprovedSnsIcon';
import { SnsGuideModalWithDescription } from '@/components/shared/SnsGuideModalWithDescription';
import { SNS_PLATFORMS, SNS_METADATA, type SnsPlatform } from '@/types/sns';
import { motion, AnimatePresence } from 'framer-motion';
import { HiInformationCircle } from 'react-icons/hi';

const SnsLinkSchema = z.object({
  platform: z.enum(SNS_PLATFORMS),
  username: z.string().optional(),
  url: z.string().url({ message: '有効なURLを入力してください' }),
});

type FormData = z.infer<typeof SnsLinkSchema>;

interface SNSLinkFormWithGuideIntegrationProps {
  onSuccess: () => void;
  existingPlatforms: string[];
}

export function SNSLinkFormWithGuideIntegration({
  onSuccess,
  existingPlatforms,
}: SNSLinkFormWithGuideIntegrationProps) {
  const [isPending, setIsPending] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<SnsPlatform | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [urlValid, setUrlValid] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [lineInputValue, setLineInputValue] = useState('');
  const [officialLineInputValue, setOfficialLineInputValue] = useState('');
  const [berealInputValue, setBerealInputValue] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(SnsLinkSchema),
    defaultValues: {
      platform: undefined,
      username: '',
      url: '',
    },
  });

  const urlValue = watch('url');
  const usernameValue = watch('username');

  // URL検証
  useEffect(() => {
    if (!urlValue) {
      setUrlValid(false);
      return;
    }

    try {
      new URL(urlValue);
      setUrlValid(true);
    } catch {
      setUrlValid(false);
    }
  }, [urlValue]);

  const availablePlatforms = SNS_PLATFORMS.filter(
    (platform) => !existingPlatforms.includes(platform),
  );

  const extractLineId = (url: string): string => {
    const lineUrlPattern = /(?:https?:\/\/)?line\.me\/ti\/p\/([^?#\s]+)/i;
    const match = url.match(lineUrlPattern);
    return match && match[1] ? match[1] : url;
  };

  const processOfficialLineUrl = (url: string): string => {
    try {
      new URL(url);
      return url;
    } catch {
      return '';
    }
  };

  const extractBerealUsername = (url: string): string => {
    const berealUrlPattern = /(?:https?:\/\/)?bere\.al\/([^?#\s\/]+)/i;
    const match = url.match(berealUrlPattern);
    return match && match[1] ? match[1] : url;
  };

  const handlePlatformSelect = (platform: SnsPlatform) => {
    setSelectedPlatform(platform);
    setValue('platform', platform);

    if (platform === 'line') {
      setValue('username', '');
      setValue('url', '');
      setLineInputValue('');
    } else if (platform === 'official-line') {
      setValue('username', '');
      setValue('url', '');
      setOfficialLineInputValue('');
    } else if (platform === 'bereal') {
      setValue('username', '');
      setValue('url', '');
      setBerealInputValue('');
    } else {
      setValue('url', SNS_METADATA[platform].baseUrl);
      setValue('username', '');
    }
  };

  const handleLineInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setLineInputValue(inputValue);
    const extractedId = extractLineId(inputValue);
    setValue('username', extractedId);
    setValue('url', `https://line.me/ti/p/${extractedId}`);
  };

  const handleOfficialLineInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setOfficialLineInputValue(inputValue);
    setValue('username', '');
    setValue('url', processOfficialLineUrl(inputValue));
  };

  const handleBerealInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setBerealInputValue(inputValue);
    const extractedUsername = extractBerealUsername(inputValue);
    setValue('username', extractedUsername);
    setValue('url', `https://bere.al/${extractedUsername}`);
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const username = e.target.value;
    setValue('username', username);

    if (selectedPlatform && SNS_METADATA[selectedPlatform].baseUrl) {
      const url = `${SNS_METADATA[selectedPlatform].baseUrl}${username}`;
      setValue('url', url);
    }
  };

  // 🚀 修正: API Route経由でSNSリンクを追加
  const onSubmit = async (data: FormData) => {
    try {
      setIsPending(true);

      let finalUrl = data.url;
      if (selectedPlatform === 'line') {
        finalUrl = `https://line.me/ti/p/${extractLineId(data.url)}`;
      }

      // 🔥 重要: Server ActionではなくAPI Routeを使用
      const response = await fetch('/api/links/sns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: data.platform,
          username: data.username,
          url: finalUrl,
        }),
      });

      if (!response.ok) {
        const responseText = await response.text();
        let errorMessage = 'SNSリンクの追加に失敗しました';

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
        throw new Error(result.error || 'SNSリンクの追加に失敗しました');
      }

      // 成功時の処理
      toast.success(`${SNS_METADATA[data.platform].name}を追加しました`);
      reset();
      setSelectedPlatform(null);
      setShowHelp(false);
      setLineInputValue('');
      setOfficialLineInputValue('');
      setBerealInputValue('');
      onSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'SNSリンクの追加に失敗しました';
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setIsPending(false);
    }
  };

  const handleOpenGuide = () => {
    if (selectedPlatform) {
      setShowGuide(true);
    }
  };

  const handleCloseGuide = () => {
    setShowGuide(false);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium leading-none mb-2 block">
            プラットフォームを選択
          </label>

          {availablePlatforms.length === 0 ? (
            <div className="bg-muted/30 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">
                すべてのプラットフォームが既に追加されています
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mt-2">
              {availablePlatforms.map((platform, index) => (
                <motion.div
                  key={platform}
                  onClick={() => handlePlatformSelect(platform)}
                  className={`
                                        flex flex-col items-center p-3 rounded-md border cursor-pointer transition-all
                                        ${
                                          selectedPlatform === platform
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                                        }
                                    `}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <ImprovedSnsIcon
                    platform={platform}
                    size={24}
                    color={selectedPlatform === platform ? 'primary' : 'default'}
                  />
                  <span className="text-xs mt-2 text-center">{SNS_METADATA[platform].name}</span>
                </motion.div>
              ))}
            </div>
          )}

          {errors.platform?.message && (
            <p className="text-sm text-destructive mt-1">{errors.platform.message}</p>
          )}
        </div>

        <AnimatePresence>
          {selectedPlatform && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 overflow-hidden"
            >
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium leading-none">
                    {selectedPlatform === 'line'
                      ? 'LINEのURL'
                      : selectedPlatform === 'official-line'
                        ? '公式LINEのURL'
                        : selectedPlatform === 'bereal'
                          ? 'BeRealのユーザー名'
                          : SNS_METADATA[selectedPlatform].placeholderText}
                  </label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowHelp(!showHelp)}
                      className="h-7 px-2 text-xs"
                    >
                      {showHelp ? 'ヘルプを隠す' : 'ヘルプ表示'}
                    </Button>
                  </div>
                </div>
                <div className="relative">
                  {selectedPlatform === 'line' ? (
                    <Input
                      value={lineInputValue}
                      onChange={handleLineInputChange}
                      placeholder="https://line.me/ti/p/..."
                      disabled={isPending}
                    />
                  ) : selectedPlatform === 'official-line' ? (
                    <Input
                      value={officialLineInputValue}
                      onChange={handleOfficialLineInputChange}
                      placeholder="https://lin.ee/xxxx"
                      disabled={isPending}
                    />
                  ) : selectedPlatform === 'bereal' ? (
                    <Input
                      value={berealInputValue}
                      onChange={handleBerealInputChange}
                      placeholder="BeRealのユーザー名"
                      disabled={isPending}
                    />
                  ) : (
                    <Input
                      value={watch('username') || ''}
                      placeholder={SNS_METADATA[selectedPlatform].placeholderText}
                      onChange={handleUsernameChange}
                      disabled={isPending}
                    />
                  )}

                  <AnimatePresence>
                    {showHelp && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="mt-2 p-3 bg-muted rounded-md"
                      >
                        <p className="text-xs">
                          {selectedPlatform === 'line'
                            ? 'LINEアプリでマイQRコードから「URLをコピー」したものを貼り付けると、IDが自動的に抽出されます。'
                            : selectedPlatform === 'official-line'
                              ? 'LINE公式アカウントの友だち追加ボタンのURLを貼り付けてください。'
                              : SNS_METADATA[selectedPlatform].helpText}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="bg-blue-50 border border-blue-100 rounded-md p-3 flex items-start"
              >
                <HiInformationCircle className="text-blue-500 w-5 h-5 mt-0.5 mr-2 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-blue-700 text-justify">
                    {SNS_METADATA[selectedPlatform].name}のアカウント情報を正しく取得するには
                    <Button
                      type="button"
                      variant="default"
                      onClick={handleOpenGuide}
                      className="mx-1 bg-blue-600 hover:bg-blue-700 text-white px-2 py-0.5 rounded text-xs inline-flex items-center h-6"
                    >
                      詳しいガイド
                    </Button>
                    をご覧ください。
                  </p>
                </div>
              </motion.div>

              {selectedPlatform === 'line' && usernameValue && (
                <div>
                  <label className="text-sm font-medium leading-none block mb-2">
                    抽出されたLINE ID
                  </label>
                  <Input value={usernameValue} readOnly className="bg-gray-50" />
                  <p className="mt-1 text-xs text-gray-500">URLから自動的に抽出されたLINE IDです</p>
                </div>
              )}

              {selectedPlatform === 'official-line' && urlValue && (
                <div>
                  <label className="text-sm font-medium leading-none block mb-2">
                    公式LINE URL
                  </label>
                  <Input value={urlValue} readOnly className="bg-gray-50" />
                  <p className="mt-1 text-xs text-gray-500">公式LINEのURLはそのまま使用されます</p>
                </div>
              )}

              {selectedPlatform === 'bereal' && usernameValue && (
                <div>
                  <label className="text-sm font-medium leading-none block mb-2">
                    抽出されたBeRealユーザー名
                  </label>
                  <Input value={usernameValue} readOnly className="bg-gray-50" />
                  <p className="mt-1 text-xs text-gray-500">
                    URLから自動的に抽出されたBeRealユーザー名です
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium leading-none block mb-2">URL</label>
                <div className="relative">
                  <Input
                    {...register('url')}
                    placeholder="https://"
                    disabled={true}
                    className={urlValid ? 'pr-8 border-green-500 bg-gray-50' : 'pr-8 bg-gray-50'}
                  />
                  {urlValid && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-500">
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
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </div>
                  )}
                  {errors.url?.message && (
                    <p className="text-sm text-destructive mt-1">{errors.url.message}</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 追加ボタン（中央配置） */}
      <div className="flex justify-center">
        <Button
          type="button"
          disabled={isPending || !selectedPlatform || !urlValid}
          className="w-full max-w-xs relative overflow-hidden group"
          onClick={handleSubmit(onSubmit)}
        >
          <span
            className={`transition-all duration-300 ${isPending ? 'opacity-0' : 'opacity-100'}`}
          >
            {isPending ? '追加中...' : 'SNSリンクを追加'}
          </span>

          {isPending && (
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
      </div>

      {selectedPlatform && (
        <SnsGuideModalWithDescription
          platform={selectedPlatform}
          isOpen={showGuide}
          onClose={handleCloseGuide}
        />
      )}
    </div>
  );
}