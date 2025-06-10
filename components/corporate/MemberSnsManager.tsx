// components/corporate/MemberSnsManager.tsx
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import type {
  DroppableProvided,
  DraggableProvided,
  DraggableStateSnapshot,
} from '@hello-pangea/dnd';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'react-hot-toast';
import { SNS_PLATFORMS, SNS_METADATA, type SnsPlatform } from '@/types/sns';
import { ImprovedSnsIcon } from '@/components/shared/ImprovedSnsIcon';
import { SnsGuideModalWithDescription } from '@/components/shared/SnsGuideModalWithDescription';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiPlus,
  HiPencil,
  HiTrash,
  HiLink,
  HiExternalLink,
  HiCheck,
  HiX,
  HiInformationCircle,
  HiDotsVertical,
} from 'react-icons/hi';

import { updateSnsLinkOrder, updateCustomLinkOrder } from '@/actions/sns';

const DroppableComponent = Droppable as React.ComponentType<{
  droppableId: string;
  children: (provided: DroppableProvided) => React.ReactNode;
}>;

const DraggableComponent = Draggable as React.ComponentType<{
  draggableId: string;
  index: number;
  children: (provided: DraggableProvided, snapshot: DraggableStateSnapshot) => React.ReactNode;
}>;

// 型定義
interface SnsLink {
  id: string;
  platform: string;
  username: string | null;
  url: string;
  displayOrder: number;
}

interface CustomLink {
  id: string;
  name: string;
  url: string;
  displayOrder: number;
}

interface TenantData {
  id: string;
  name: string;
  primaryColor: string | null;
  secondaryColor: string | null;
  corporatePrimary?: string | null;
  corporateSecondary?: string | null;
}

interface MemberSnsManagerProps {
  personalSnsLinks: SnsLink[];
  customLinks: CustomLink[];
  tenantData: TenantData | null;
  corporatePlatforms: string[];
  corporatePlatformUrls?: {
    [key: string]: {
      username: string | null;
      url: string;
    };
  };
  onSnsLinkUpdate: (updatedLinks: SnsLink[]) => void;
  onCustomLinkUpdate: (updatedLinks: CustomLink[]) => void;
}

export function MemberSnsManager({
  personalSnsLinks,
  customLinks,
  tenantData,
  corporatePlatforms,
  corporatePlatformUrls = {},
  onSnsLinkUpdate,
  onCustomLinkUpdate,
}: MemberSnsManagerProps) {
  const primaryColor = tenantData?.primaryColor || tenantData?.corporatePrimary || '#1E3A8A';

  // SNSリンク管理の状態
  const [snsItems, setSnsItems] = useState(personalSnsLinks);
  const [selectedPlatform, setSelectedPlatform] = useState<SnsPlatform | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [urlValid, setUrlValid] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [lineInputValue, setLineInputValue] = useState('');
  const [officialLineInputValue, setOfficialLineInputValue] = useState('');
  const [berealInputValue, setBerealInputValue] = useState('');
  const [isAddingSns, setIsAddingSns] = useState(false);
  const [editingSnsId, setEditingSnsId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // カスタムリンク管理の状態
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [editingCustomId, setEditingCustomId] = useState<string | null>(null);
  const [customItems, setCustomItems] = useState(customLinks);

  // フォーム状態
  const [snsForm, setSnsForm] = useState({
    platform: '',
    username: '',
    url: '',
  });

  const [customForm, setCustomForm] = useState({
    name: '',
    url: '',
  });

  const corporatePlatformUrlsRef = useRef(corporatePlatformUrls);

  useEffect(() => {
    corporatePlatformUrlsRef.current = corporatePlatformUrls;
  }, [corporatePlatformUrls]);

  useEffect(() => {
    setSnsItems(personalSnsLinks);
  }, [personalSnsLinks]);

  useEffect(() => {
    setCustomItems(customLinks);
  }, [customLinks]);

  // URL検証
  useEffect(() => {
    if (!snsForm.url) {
      setUrlValid(false);
      return;
    }
    try {
      new URL(snsForm.url);
      setUrlValid(true);
    } catch (err) {
      setUrlValid(false);
    }
  }, [snsForm.url]);

  // 利用可能なプラットフォーム
  const availablePlatforms = useMemo(() => {
    const usedPlatforms = [...personalSnsLinks.map((link) => link.platform), ...corporatePlatforms];
    return SNS_PLATFORMS.filter((platform) => !usedPlatforms.includes(platform));
  }, [personalSnsLinks, corporatePlatforms]);

  // LINE関連のヘルパー関数
  const extractLineId = (url: string): string => {
    const lineUrlPattern = /(?:https?:\/\/)?line\.me\/ti\/p\/([^?#\s]+)/i;
    const match = url.match(lineUrlPattern);
    return match && match[1] ? match[1] : url;
  };

  const processOfficialLineUrl = (url: string): string => {
    try {
      new URL(url);
      return url;
    } catch (err) {
      return '';
    }
  };

  const extractBerealUsername = (url: string): string => {
    const berealUrlPattern = /(?:https?:\/\/)?bere\.al\/([^?#\s\/]+)/i;
    const match = url.match(berealUrlPattern);
    return match && match[1] ? match[1] : url;
  };

  // プラットフォーム選択処理
  const handlePlatformSelect = (platform: SnsPlatform) => {
    setSelectedPlatform(platform);
    const corporateLink = corporatePlatformUrlsRef.current[platform];

    setSnsForm({
      platform,
      username: corporateLink?.username || '',
      url:
        corporateLink?.url ||
        (platform === 'line' || platform === 'official-line' || platform === 'bereal'
          ? ''
          : SNS_METADATA[platform].baseUrl),
    });

    if (platform === 'line') {
      setLineInputValue('');
    } else if (platform === 'official-line') {
      setOfficialLineInputValue('');
    } else if (platform === 'bereal') {
      setBerealInputValue('');
    }
  };

  // 入力変更ハンドラー
  const handleLineInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setLineInputValue(inputValue);
    const extractedId = extractLineId(inputValue);
    setSnsForm((prev) => ({
      ...prev,
      username: extractedId,
      url: `https://line.me/ti/p/${extractedId}`,
    }));
  };

  const handleOfficialLineInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setOfficialLineInputValue(inputValue);
    setSnsForm((prev) => ({
      ...prev,
      username: '',
      url: processOfficialLineUrl(inputValue),
    }));
  };

  const handleBerealInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setBerealInputValue(inputValue);
    const extractedUsername = extractBerealUsername(inputValue);
    setSnsForm((prev) => ({
      ...prev,
      username: extractedUsername,
      url: `https://bere.al/${extractedUsername}`,
    }));
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const username = e.target.value;
    setSnsForm((prev) => {
      if (selectedPlatform && SNS_METADATA[selectedPlatform].baseUrl) {
        return {
          ...prev,
          username,
          url: `${SNS_METADATA[selectedPlatform].baseUrl}${username}`,
        };
      }
      return { ...prev, username };
    });
  };

  // SNSリンク追加処理
  const handleAddSns = async () => {
    if (!selectedPlatform || !snsForm.url) {
      toast.error('プラットフォームとURLは必須です');
      return;
    }

    try {
      setIsProcessing(true);
      let finalUrl = snsForm.url;

      if (selectedPlatform === 'line') {
        finalUrl = `https://line.me/ti/p/${extractLineId(snsForm.url)}`;
      }

      const response = await fetch('/api/corporate-member/links/sns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: selectedPlatform,
          username: snsForm.username,
          url: finalUrl,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'SNSリンクの追加に失敗しました');
      }

      const data = await response.json();
      const newLinks = [...personalSnsLinks, data.snsLink];
      onSnsLinkUpdate(newLinks);
      setSnsItems(newLinks);

      resetSnsForm();
      toast.success(`${SNS_METADATA[selectedPlatform].name}を追加しました`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'SNSリンクの追加に失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  // SNSリンク更新処理
  const handleUpdateSns = async (id: string) => {
    if (!snsForm.url) {
      toast.error('URLは必須です');
      return;
    }

    try {
      setIsProcessing(true);
      let finalUrl = snsForm.url;

      if (selectedPlatform === 'line') {
        finalUrl = `https://line.me/ti/p/${extractLineId(snsForm.url)}`;
      }

      const response = await fetch(`/api/corporate-member/links/sns/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: snsForm.username,
          url: finalUrl,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'SNSリンクの更新に失敗しました');
      }

      const data = await response.json();
      const updatedLinks = personalSnsLinks.map((link) => (link.id === id ? data.snsLink : link));
      onSnsLinkUpdate(updatedLinks);
      setSnsItems(updatedLinks);

      setEditingSnsId(null);
      resetSnsForm();
      toast.success('SNSリンクを更新しました');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'SNSリンクの更新に失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  // SNSリンク削除処理
  const handleDeleteSns = async (id: string, platform: string) => {
    if (corporatePlatforms.includes(platform)) {
      toast.error('法人共通の必須SNSリンクは削除できません');
      return;
    }

    if (!confirm('このSNSリンクを削除してもよろしいですか？')) {
      return;
    }

    try {
      setIsProcessing(true);
      const response = await fetch(`/api/corporate-member/links/sns/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'SNSリンクの削除に失敗しました');
      }

      const updatedLinks = personalSnsLinks.filter((link) => link.id !== id);
      onSnsLinkUpdate(updatedLinks);
      setSnsItems(updatedLinks);
      toast.success('SNSリンクを削除しました');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'SNSリンクの削除に失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  // ドラッグ&ドロップ処理
  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      if (!result.destination) return;

      const reorderedItems = Array.from(snsItems);
      const [removed] = reorderedItems.splice(result.source.index, 1);
      reorderedItems.splice(result.destination.index, 0, removed);

      setSnsItems(reorderedItems);

      try {
        setIsProcessing(true);
        const linkIds = reorderedItems.map((item) => item.id);

        const response = await updateSnsLinkOrder(linkIds);

        if (response.error) {
          throw new Error(response.error);
        }

        onSnsLinkUpdate(reorderedItems);
        toast.success('表示順を更新しました');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : '表示順の更新に失敗しました');
        setSnsItems(personalSnsLinks);
      } finally {
        setIsProcessing(false);
      }
    },
    [snsItems, personalSnsLinks, onSnsLinkUpdate],
  );

  const handleCustomDragEnd = useCallback(
    async (result: DropResult) => {
      if (!result.destination) return;

      const reorderedItems = Array.from(customItems);
      const [removed] = reorderedItems.splice(result.source.index, 1);
      reorderedItems.splice(result.destination.index, 0, removed);

      setCustomItems(reorderedItems);

      try {
        setIsProcessing(true);
        const linkIds = reorderedItems.map((item) => item.id);

        const response = await updateCustomLinkOrder(linkIds);

        if (response.error) {
          throw new Error(response.error);
        }

        onCustomLinkUpdate(reorderedItems);
        toast.success('表示順を更新しました');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : '表示順の更新に失敗しました');
        setCustomItems(customLinks);
      } finally {
        setIsProcessing(false);
      }
    },
    [customItems, customLinks, onCustomLinkUpdate],
  );

  // カスタムリンク処理
  const handleAddCustom = async () => {
    if (!customForm.name || !customForm.url) {
      toast.error('名前とURLは必須です');
      return;
    }

    try {
      setIsProcessing(true);
      const response = await fetch('/api/corporate-member/links/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customForm),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'カスタムリンクの追加に失敗しました');
      }

      const data = await response.json();
      onCustomLinkUpdate([...customLinks, data.customLink]);
      setCustomForm({ name: '', url: '' });
      setIsAddingCustom(false);
      toast.success('カスタムリンクを追加しました');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'カスタムリンクの追加に失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateCustom = async (id: string) => {
    if (!customForm.name || !customForm.url) {
      toast.error('名前とURLは必須です');
      return;
    }

    try {
      setIsProcessing(true);
      const response = await fetch(`/api/corporate-member/links/custom/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customForm),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'カスタムリンクの更新に失敗しました');
      }

      const data = await response.json();
      const updatedLinks = customLinks.map((link) => (link.id === id ? data.customLink : link));
      onCustomLinkUpdate(updatedLinks);
      setEditingCustomId(null);
      setCustomForm({ name: '', url: '' });
      toast.success('カスタムリンクを更新しました');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'カスタムリンクの更新に失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteCustom = async (id: string) => {
    if (!confirm('このカスタムリンクを削除してもよろしいですか？')) {
      return;
    }

    try {
      setIsProcessing(true);
      const response = await fetch(`/api/corporate-member/links/custom/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'カスタムリンクの削除に失敗しました');
      }

      const updatedLinks = customLinks.filter((link) => link.id !== id);
      onCustomLinkUpdate(updatedLinks);
      toast.success('カスタムリンクを削除しました');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'カスタムリンクの削除に失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  // ヘルパー関数
  const resetSnsForm = () => {
    setSnsForm({ platform: '', username: '', url: '' });
    setSelectedPlatform(null);
    setShowHelp(false);
    setLineInputValue('');
    setOfficialLineInputValue('');
    setBerealInputValue('');
    setIsAddingSns(false);
  };

  const startEditingSns = (link: SnsLink) => {
    setEditingSnsId(link.id);
    setSelectedPlatform(link.platform as SnsPlatform);
    setSnsForm({
      platform: link.platform,
      username: link.username || '',
      url: link.url,
    });

    if (link.platform === 'line') {
      setLineInputValue(link.url);
    } else if (link.platform === 'official-line') {
      setOfficialLineInputValue(link.url);
    } else if (link.platform === 'bereal') {
      setBerealInputValue(link.username || '');
    }
  };

  const startEditingCustom = (link: CustomLink) => {
    setEditingCustomId(link.id);
    setCustomForm({
      name: link.name,
      url: link.url,
    });
  };

  return (
    <div id="member-sns-section" className="space-y-6">
      {/* SNSリンク管理セクション */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold flex items-center mb-2 sm:mb-0">
              <HiLink className="mr-2 h-5 w-5 text-gray-600 flex-shrink-0" />
              SNSリンク管理
            </h2>
            <p className="text-sm text-gray-600">
              プロフィールに表示するSNSアカウントを管理します。
            </p>
          </div>
          <Button
            variant="corporate"
            className="h-[48px] text-base sm:text-sm w-full sm:w-auto"
            onClick={() => setIsAddingSns(true)}
            disabled={isAddingSns || availablePlatforms.length === 0 || isProcessing}
          >
            <HiPlus className="mr-1 h-4 w-4" />
            追加
          </Button>
        </div>

        {/* SNS追加フォーム */}
        <AnimatePresence>
          {isAddingSns && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="border rounded-md p-4 mb-6"
              style={{ borderColor: `${primaryColor}20` }}
            >
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium leading-none mb-2 block">
                    プラットフォームを選択
                  </label>
                  {availablePlatforms.length === 0 ? (
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <p className="text-sm text-gray-500">
                        すべてのプラットフォームが既に追加されています
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 mt-2">
                      {availablePlatforms.map((platform, index) => (
                        <motion.div
                          key={platform}
                          onClick={() => handlePlatformSelect(platform)}
                          className={`
                            flex flex-col items-center p-2 sm:p-3 rounded-md border cursor-pointer transition-all
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
                            size={20}
                            color={selectedPlatform === platform ? 'primary' : 'default'}
                          />
                          <span className="text-xs mt-1 text-center leading-tight">
                            {SNS_METADATA[platform].name}
                          </span>
                        </motion.div>
                      ))}
                    </div>
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
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-2">
                          <label className="text-sm font-medium leading-none">
                            {selectedPlatform === 'line'
                              ? 'LINEのURL'
                              : selectedPlatform === 'official-line'
                                ? '公式LINEのURL'
                                : selectedPlatform === 'bereal'
                                  ? 'BeRealのユーザー名'
                                  : SNS_METADATA[selectedPlatform].placeholderText}
                          </label>
                          <Button
                            variant="ghost"
                            className="h-[48px] text-base sm:text-sm w-full sm:w-auto"
                            onClick={() => setShowHelp(!showHelp)}
                          >
                            {showHelp ? 'ヘルプを隠す' : 'ヘルプ表示'}
                          </Button>
                        </div>

                        <div className="space-y-2">
                          {selectedPlatform === 'line' ? (
                            <Input
                              value={lineInputValue}
                              onChange={handleLineInputChange}
                              placeholder="https://line.me/ti/p/..."
                              disabled={isProcessing}
                            />
                          ) : selectedPlatform === 'official-line' ? (
                            <Input
                              value={officialLineInputValue}
                              onChange={handleOfficialLineInputChange}
                              placeholder="https://lin.ee/xxxx"
                              disabled={isProcessing}
                            />
                          ) : selectedPlatform === 'bereal' ? (
                            <Input
                              value={berealInputValue}
                              onChange={handleBerealInputChange}
                              placeholder="BeRealのユーザー名"
                              disabled={isProcessing}
                            />
                          ) : (
                            <Input
                              value={snsForm.username}
                              placeholder={SNS_METADATA[selectedPlatform].placeholderText}
                              onChange={handleUsernameChange}
                              disabled={isProcessing}
                            />
                          )}

                          <AnimatePresence>
                            {showHelp && (
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="p-3 bg-gray-50 rounded-md"
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
                        className="bg-blue-50 border border-blue-100 rounded-md p-3 flex flex-col sm:flex-row sm:items-start gap-2"
                      >
                        <HiInformationCircle className="text-blue-500 w-5 h-5 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-blue-700">
                            {SNS_METADATA[selectedPlatform].name}
                            のアカウント情報を正しく取得するには
                            <Button
                              variant="corporate"
                              className="h-[48px] text-base sm:text-sm mx-1 px-2"
                              onClick={() => setShowGuide(true)}
                            >
                              詳しいガイド
                            </Button>
                            をご覧ください。
                          </p>
                        </div>
                      </motion.div>

                      {/* URL表示 */}
                      <div>
                        <label className="text-sm font-medium leading-none block mb-2">URL</label>
                        <div className="relative">
                          <Input
                            value={snsForm.url}
                            placeholder="https://"
                            disabled={true}
                            className={
                              urlValid ? 'pr-8 border-green-500 bg-gray-50' : 'pr-8 bg-gray-50'
                            }
                          />
                          {urlValid && (
                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-green-500">
                              <HiCheck className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Button
                    variant="corporateOutline"
                    className="h-[48px] text-base sm:text-sm w-full sm:w-auto order-2 sm:order-1"
                    onClick={resetSnsForm}
                    disabled={isProcessing}
                  >
                    キャンセル
                  </Button>
                  <Button
                    variant="corporate"
                    className="h-[48px] text-base sm:text-sm w-full sm:w-auto order-1 sm:order-2"
                    onClick={handleAddSns}
                    disabled={!selectedPlatform || !urlValid || isProcessing}
                  >
                    {isProcessing ? '追加中...' : '追加'}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SNSリンクリスト */}
        {snsItems.length > 0 ? (
          <DragDropContext onDragEnd={handleDragEnd}>
            <DroppableComponent droppableId="member-sns-links">
              {(provided: DroppableProvided) => (
                <div className="space-y-3" ref={provided.innerRef} {...provided.droppableProps}>
                  {snsItems.map((link, index) => (
                    <DraggableComponent key={link.id} draggableId={link.id} index={index}>
                      {(dragProvided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          className={`rounded-lg border ${snapshot.isDragging ? 'shadow-md' : ''}`}
                          style={{
                            ...dragProvided.draggableProps.style,
                            backgroundColor: 'white',
                            borderColor: `${primaryColor}20`,
                          }}
                        >
                          {editingSnsId === link.id ? (
                            // 編集モード
                            <div className="p-4 space-y-3">
                              <div className="flex items-center">
                                <ImprovedSnsIcon
                                  platform={link.platform as SnsPlatform}
                                  size={24}
                                  color="original"
                                />
                                <h3 className="ml-3 font-medium">
                                  {SNS_METADATA[link.platform as SnsPlatform]?.name ||
                                    link.platform}
                                </h3>
                              </div>

                              {selectedPlatform === 'line' ? (
                                <Input
                                  value={lineInputValue}
                                  onChange={handleLineInputChange}
                                  placeholder="https://line.me/ti/p/..."
                                  disabled={isProcessing}
                                />
                              ) : selectedPlatform === 'official-line' ? (
                                <Input
                                  value={officialLineInputValue}
                                  onChange={handleOfficialLineInputChange}
                                  placeholder="https://lin.ee/xxxx"
                                  disabled={isProcessing}
                                />
                              ) : selectedPlatform === 'bereal' ? (
                                <Input
                                  value={berealInputValue}
                                  onChange={handleBerealInputChange}
                                  placeholder="BeRealのユーザー名"
                                  disabled={isProcessing}
                                />
                              ) : (
                                <div className="space-y-3">
                                  <Input
                                    value={snsForm.username}
                                    onChange={handleUsernameChange}
                                    placeholder={
                                      SNS_METADATA[link.platform as SnsPlatform]?.placeholderText
                                    }
                                    disabled={isProcessing}
                                  />
                                  <Input
                                    value={snsForm.url}
                                    onChange={(e) =>
                                      setSnsForm((prev) => ({ ...prev, url: e.target.value }))
                                    }
                                    placeholder="https://..."
                                    disabled={isProcessing}
                                  />
                                </div>
                              )}

                              <div className="flex flex-col sm:flex-row gap-2">
                                <Button
                                  variant="corporateOutline"
                                  className="h-[48px] text-base sm:text-sm w-full sm:w-auto order-2 sm:order-1"
                                  onClick={() => {
                                    setEditingSnsId(null);
                                    resetSnsForm();
                                  }}
                                  disabled={isProcessing}
                                >
                                  キャンセル
                                </Button>
                                <Button
                                  variant="corporate"
                                  className="h-[48px] text-base sm:text-sm w-full sm:w-auto order-1 sm:order-2"
                                  onClick={() => handleUpdateSns(link.id)}
                                  disabled={isProcessing}
                                >
                                  更新
                                </Button>
                              </div>
                            </div>
                          ) : (
                            // 表示モード - モバイル最適化
                            <div className="p-3">
                              <div className="flex items-start gap-3">
                                <div
                                  className="cursor-move flex-shrink-0 mt-1"
                                  {...dragProvided.dragHandleProps}
                                >
                                  <HiDotsVertical className="w-5 h-5 text-gray-400" />
                                </div>
                                <div className="flex-shrink-0 mt-1">
                                  <ImprovedSnsIcon
                                    platform={link.platform as SnsPlatform}
                                    size={24}
                                    color="original"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                    <div className="min-w-0">
                                      <p className="font-medium text-sm mb-1">
                                        {SNS_METADATA[link.platform as SnsPlatform]?.name ||
                                          link.platform}
                                      </p>
                                      <a
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-600 hover:underline break-all flex items-start gap-1"
                                      >
                                        <span className="break-all">{link.url}</span>
                                        <HiExternalLink className="h-3 w-3 flex-shrink-0 mt-0.5" />
                                      </a>
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0">
                                      <Button
                                        variant="ghost"
                                        className="h-[48px] w-[48px] p-0"
                                        onClick={() => startEditingSns(link)}
                                        disabled={isProcessing}
                                      >
                                        <HiPencil className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="destructive"
                                        className="h-[48px] w-[48px] p-0"
                                        onClick={() => handleDeleteSns(link.id, link.platform)}
                                        disabled={
                                          isProcessing || corporatePlatforms.includes(link.platform)
                                        }
                                      >
                                        <HiTrash className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </DraggableComponent>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </DroppableComponent>
          </DragDropContext>
        ) : (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <p className="text-gray-500">まだSNSリンクがありません</p>
          </div>
        )}
      </div>

      {/* カスタムリンク管理セクション */}
      <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold flex items-center mb-2 sm:mb-0">
              <HiLink className="mr-2 h-5 w-5 text-gray-600 flex-shrink-0" />
              カスタムリンク管理
            </h2>
            <p className="text-sm text-gray-600">
              SNS以外のカスタムリンクを管理します（ブログ、ポートフォリオなど）。
            </p>
          </div>
          <Button
            variant="corporate"
            className="h-[48px] text-base sm:text-sm w-full sm:w-auto"
            onClick={() => setIsAddingCustom(true)}
            disabled={isAddingCustom || isProcessing}
          >
            <HiPlus className="mr-1 h-4 w-4" />
            追加
          </Button>
        </div>

        {/* カスタムリンク追加フォーム */}
        <AnimatePresence>
          {isAddingCustom && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="border rounded-md p-4 mb-6"
              style={{ borderColor: `${primaryColor}20` }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">表示名</label>
                  <Input
                    placeholder="ブログ、ポートフォリオなど"
                    value={customForm.name}
                    onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })}
                    disabled={isProcessing}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                  <Input
                    placeholder="https://..."
                    value={customForm.url}
                    onChange={(e) => setCustomForm({ ...customForm, url: e.target.value })}
                    disabled={isProcessing}
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="corporateOutline"
                    className="h-[48px] text-base sm:text-sm w-full sm:w-auto order-2 sm:order-1"
                    onClick={() => {
                      setIsAddingCustom(false);
                      setCustomForm({ name: '', url: '' });
                    }}
                    disabled={isProcessing}
                  >
                    キャンセル
                  </Button>
                  <Button
                    variant="corporate"
                    className="h-[48px] text-base sm:text-sm w-full sm:w-auto order-1 sm:order-2"
                    onClick={handleAddCustom}
                    disabled={isProcessing}
                  >
                    追加
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* カスタムリンクリスト */}
        <div className="space-y-4">
          {customItems.length === 0 ? (
            <p className="text-gray-500 text-center py-4">カスタムリンクがありません</p>
          ) : (
            <DragDropContext onDragEnd={handleCustomDragEnd}>
              <DroppableComponent droppableId="member-custom-links">
                {(provided: DroppableProvided) => (
                  <div className="space-y-3" ref={provided.innerRef} {...provided.droppableProps}>
                    {customItems.map((link, index) => (
                      <DraggableComponent key={link.id} draggableId={link.id} index={index}>
                        {(dragProvided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            className="border rounded-md"
                            style={{
                              ...dragProvided.draggableProps.style,
                              borderColor: `${primaryColor}20`,
                            }}
                          >
                            {editingCustomId === link.id ? (
                              // 編集モード
                              <div className="p-4 space-y-3">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    表示名
                                  </label>
                                  <Input
                                    placeholder="ブログ、ポートフォリオなど"
                                    value={customForm.name}
                                    onChange={(e) =>
                                      setCustomForm({ ...customForm, name: e.target.value })
                                    }
                                    disabled={isProcessing}
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    URL
                                  </label>
                                  <Input
                                    placeholder="https://..."
                                    value={customForm.url}
                                    onChange={(e) =>
                                      setCustomForm({ ...customForm, url: e.target.value })
                                    }
                                    disabled={isProcessing}
                                  />
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2">
                                  <Button
                                    variant="corporateOutline"
                                    className="h-[48px] text-base sm:text-sm w-full sm:w-auto order-2 sm:order-1"
                                    onClick={() => {
                                      setEditingCustomId(null);
                                      setCustomForm({ name: '', url: '' });
                                    }}
                                    disabled={isProcessing}
                                  >
                                    キャンセル
                                  </Button>
                                  <Button
                                    variant="corporate"
                                    className="h-[48px] text-base sm:text-sm w-full sm:w-auto order-1 sm:order-2"
                                    onClick={() => handleUpdateCustom(link.id)}
                                    disabled={isProcessing}
                                  >
                                    更新
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              // 表示モード - モバイル最適化
                              <div className="p-3">
                                <div className="flex items-start gap-3">
                                  <div
                                    className="cursor-move flex-shrink-0 mt-1"
                                    {...dragProvided.dragHandleProps}
                                  >
                                    <HiDotsVertical className="w-5 h-5 text-gray-400" />
                                  </div>
                                  <div
                                    className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0"
                                    style={{ backgroundColor: `${primaryColor}15` }}
                                  >
                                    <HiLink className="h-5 w-5" style={{ color: primaryColor }} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                      <div className="min-w-0">
                                        <p className="font-medium text-sm mb-1">{link.name}</p>
                                        <a
                                          href={link.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs text-blue-600 hover:underline break-all flex items-start gap-1"
                                        >
                                          <span className="break-all">{link.url}</span>
                                          <HiExternalLink className="h-3 w-3 flex-shrink-0 mt-0.5" />
                                        </a>
                                      </div>
                                      <div className="flex gap-2 flex-shrink-0">
                                        <Button
                                          variant="ghost"
                                          className="h-[48px] w-[48px] p-0"
                                          onClick={() => startEditingCustom(link)}
                                          disabled={isProcessing}
                                        >
                                          <HiPencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="destructive"
                                          className="h-[48px] w-[48px] p-0"
                                          onClick={() => handleDeleteCustom(link.id)}
                                          disabled={isProcessing}
                                        >
                                          <HiTrash className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </DraggableComponent>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </DroppableComponent>
            </DragDropContext>
          )}
        </div>
      </div>

      {/* SNSガイドモーダル */}
      {showGuide && selectedPlatform && (
        <SnsGuideModalWithDescription
          platform={selectedPlatform}
          onClose={() => setShowGuide(false)}
          isOpen={showGuide}
        />
      )}
    </div>
  );
}