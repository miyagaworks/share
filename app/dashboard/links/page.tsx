// app/dashboard/links/page.tsx (修正版 - リロードなし)
'use client';
import { useState, useEffect, useCallback } from 'react';
import { redirect, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { DashboardSection } from '@/components/layout/DashboardLayout';
import { DashboardCard } from '@/components/ui/DashboardCard';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Spinner } from '@/components/ui/Spinner';
import { ImprovedSnsLinkList } from '@/components/dashboard/ImprovedSnsLinkList';
import { CustomLinkForm } from '@/components/forms/CustomLinkForm';
import { CustomLinkList } from '@/components/dashboard/CustomLinkList';
import { SNSLinkFormWithGuideIntegration } from '@/components/forms/SNSLinkFormWithGuideIntegration';
import { SnsLinkEditForm } from '@/app/dashboard/links/components/SnsLinkEditForm';
import { CustomLinkEditForm } from '@/app/dashboard/links/components/CustomLinkEditForm';
import { ImprovedSnsIcon } from '@/components/shared/ImprovedSnsIcon';
import { SNS_METADATA, type SnsPlatform } from '@/types/sns';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import type { SnsLink, CustomLink } from '@prisma/client';
import { HiLink, HiPlus, HiGlobeAlt, HiPencil } from 'react-icons/hi';
export default function LinksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [snsLinks, setSnsLinks] = useState<SnsLink[]>([]);
  const [customLinks, setCustomLinks] = useState<CustomLink[]>([]);
  const [editingSnsId, setEditingSnsId] = useState<string | null>(null);
  const [editingCustomId, setEditingCustomId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('sns');
  const [isAddingSns, setIsAddingSns] = useState(false);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const editingSnsLink = snsLinks.find((link) => link.id === editingSnsId);
  const editingCustomLink = customLinks.find((link) => link.id === editingCustomId);
  // 編集ダイアログを開く
  const handleEditSnsLink = (id: string) => {
    setEditingSnsId(id);
  };
  // カスタムリンク編集ダイアログを開く
  const handleEditCustomLink = (id: string) => {
    setEditingCustomId(id);
  };
  // 編集成功時の処理
  const handleEditSuccess = () => {
    setEditingSnsId(null);
    setEditingCustomId(null);
    handleUpdate();
  };
  // 🚀 追加: デバッグ用のstate
  const [refreshKey, setRefreshKey] = useState(0);
  // 🚀 修正: より確実なfetchLinks関数
  const fetchLinks = useCallback(async () => {
    try {
      // より強力なキャッシュバスティング
      const timestamp = Date.now();
      const randomParam = Math.random().toString(36).substring(7);
      const sessionParam = session?.user?.id ? session.user.id.slice(-8) : 'guest';
      const url = `/api/links?_t=${timestamp}&_r=${randomParam}&_s=${sessionParam}&_refresh=${refreshKey}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
          'X-Requested-With': 'XMLHttpRequest',
        },
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: リンクの取得に失敗しました`);
      }
      const data = await response.json();

      return data;
    } catch (error) {
      toast.error('リンクの取得に失敗しました');
      return { snsLinks: [], customLinks: [] };
    }
  }, [session?.user?.id, refreshKey]);
  // セッションチェックと初期データ取得
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      redirect('/auth/signin');
      return;
    }
    const loadLinks = async () => {
      setIsLoading(true);
      try {
        const data = await fetchLinks();
        setSnsLinks(data.snsLinks || []);
        setCustomLinks(data.customLinks || []);
      } catch (error) {
        toast.error('リンクの取得に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };
    loadLinks();
  }, [session, status, router, fetchLinks]);
  // 🚀 修正: SNSリンク追加成功時の処理（リロードなし）
  const handleSnsAddSuccess = async () => {
    if (isProcessing) return;
    try {
      setIsProcessing(true);
      // フォームを閉じる
      setIsAddingSns(false);
      // データを再取得
      const data = await fetchLinks();
      // 強制的にstateを更新
      setSnsLinks([...(data.snsLinks || [])]);
      setCustomLinks([...(data.customLinks || [])]);
      toast.success('SNSリンクを追加しました！');
    } catch (error) {
      toast.error('データの更新に失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };
  // 🚀 修正: カスタムリンク追加成功時の処理（リロードなし）
  const handleCustomAddSuccess = async () => {
    if (isProcessing) return;
    try {
      setIsProcessing(true);
      // フォームを閉じる
      setIsAddingCustom(false);
      // refresh keyを更新
      setRefreshKey((prev) => prev + 1);
      // 少し待機してからデータ取得
      await new Promise((resolve) => setTimeout(resolve, 200));
      // データを再取得
      const data = await fetchLinks();
      // 🔥 重要: 強制的にstateを更新
      setSnsLinks([...(data.snsLinks || [])]);
      setCustomLinks([...(data.customLinks || [])]);
      toast.success('カスタムリンクを追加しました！');

      // コンポーネントの強制再レンダリング
      setTimeout(() => {
        setRefreshKey((prev) => prev + 1);
      }, 100);
    } catch (error) {
      toast.error('データの更新に失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };
  // リンク情報の更新処理（削除・編集・並び替え時）
  const handleUpdate = async () => {
    try {
      // refresh keyを更新
      setRefreshKey((prev) => prev + 1);
      // データを再取得
      const data = await fetchLinks();
      // 強制的にstateを更新
      setSnsLinks([...(data.snsLinks || [])]);
      setCustomLinks([...(data.customLinks || [])]);

    } catch (error) {
      toast.error('リンク情報の取得に失敗しました');
    }
  };
  // コンテンツのトランジション設定
  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };
  // デバッグ情報の表示（本番環境では無効）
  return (
    <div className="space-y-6" key={`links-page-${refreshKey}`}>
      <div className="flex items-center mb-6">
        <HiLink className="h-8 w-8 text-gray-700 mr-3" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SNS・リンク管理</h1>
          <p className="text-muted-foreground text-justify">
            プロフィールに表示するSNSアカウントとWebサイトリンクを管理できます
          </p>
        </div>
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <TabsList className="mb-4 sm:mb-0 bg-blue-50 p-1 rounded-lg border border-blue-100">
            <TabsTrigger
              value="sns"
              className={`px-4 py-2 rounded-md transition-all ${
                activeTab === 'sns'
                  ? 'bg-blue-600 shadow-sm text-white font-medium'
                  : 'text-blue-700 hover:bg-blue-100'
              }`}
            >
              <span className="flex items-center">
                <HiLink className="mr-2 h-4 w-4" />
                SNSリンク
                {snsLinks.length > 0 && (
                  <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-medium text-blue-600">
                    {snsLinks.length}
                  </span>
                )}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="custom"
              className={`px-4 py-2 rounded-md transition-all ${
                activeTab === 'custom'
                  ? 'bg-blue-600 shadow-sm text-white font-medium'
                  : 'text-blue-700 hover:bg-blue-100'
              }`}
            >
              <span className="flex items-center">
                <HiGlobeAlt className="mr-2 h-4 w-4" />
                カスタムリンク
                {customLinks.length > 0 && (
                  <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-medium text-blue-600">
                    {customLinks.length}
                  </span>
                )}
              </span>
            </TabsTrigger>
          </TabsList>
          <div>
            {activeTab === 'sns' && (
              <Button
                onClick={() => setIsAddingSns(true)}
                className="flex items-center"
                disabled={isProcessing}
              >
                <HiPlus className="mr-2 h-4 w-4" />
                SNSリンクを追加
              </Button>
            )}
            {activeTab === 'custom' && (
              <Button
                onClick={() => setIsAddingCustom(true)}
                className="flex items-center"
                disabled={isProcessing}
              >
                <HiPlus className="mr-2 h-4 w-4" />
                カスタムリンクを追加
              </Button>
            )}
          </div>
        </div>
        <TabsContent value="sns" className="outline-none">
          <motion.div initial="hidden" animate="visible" variants={contentVariants}>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center min-h-[200px]">
                <Spinner size="lg" />
                <p className="mt-4 text-sm text-gray-500">SNSリンク情報を読み込んでいます...</p>
              </div>
            ) : snsLinks.length === 0 && !isAddingSns ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <HiLink className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  まだSNSリンクがありません
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  「SNSリンクを追加」ボタンから追加してください
                </p>
                <div className="flex justify-center mt-6">
                  <Button
                    onClick={() => setIsAddingSns(true)}
                    className="flex items-center justify-center"
                    disabled={isProcessing}
                  >
                    <HiPlus className="mr-2 h-4 w-4" />
                    SNSリンクを追加
                  </Button>
                </div>
              </div>
            ) : (
              <DashboardSection>
                {isAddingSns && (
                  <DashboardCard title="新規SNSリンク追加" className="mb-6">
                    <SNSLinkFormWithGuideIntegration
                      key={`sns-form-${refreshKey}`}
                      existingPlatforms={snsLinks.map((link) => link.platform)}
                      onSuccess={handleSnsAddSuccess}
                    />
                    <div className="mt-4 flex justify-center">
                      <Button
                        variant="outline"
                        onClick={() => setIsAddingSns(false)}
                        className="flex items-center"
                        disabled={isProcessing}
                      >
                        キャンセル
                      </Button>
                    </div>
                  </DashboardCard>
                )}
                {snsLinks.length > 0 && !isAddingSns && (
                  <div className="flex justify-center mb-4">
                    <Button
                      onClick={() => setIsAddingSns(true)}
                      className="flex items-center"
                      disabled={isProcessing}
                    >
                      <HiPlus className="mr-2 h-4 w-4" />
                      SNSリンクを追加
                    </Button>
                  </div>
                )}
                {snsLinks.length > 0 && (
                  <DashboardCard
                    title="登録済みSNSリンク"
                    icon={<HiLink className="h-5 w-5 text-gray-500" />}
                    description="ドラッグ＆ドロップで順番を変更できます"
                  >
                    <ImprovedSnsLinkList
                      key={`sns-list-${refreshKey}-${snsLinks.length}`}
                      links={snsLinks}
                      onUpdate={handleUpdate}
                      onEdit={handleEditSnsLink}
                    />
                  </DashboardCard>
                )}
              </DashboardSection>
            )}
          </motion.div>
        </TabsContent>
        <TabsContent value="custom" className="outline-none">
          <motion.div initial="hidden" animate="visible" variants={contentVariants}>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center min-h-[200px]">
                <Spinner size="lg" />
                <p className="mt-4 text-sm text-gray-500">
                  カスタムリンク情報を読み込んでいます...
                </p>
              </div>
            ) : customLinks.length === 0 && !isAddingCustom ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <HiGlobeAlt className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  まだカスタムリンクがありません
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  「カスタムリンクを追加」ボタンから追加してください
                </p>
                <div className="flex justify-center mt-6">
                  <Button
                    onClick={() => setIsAddingCustom(true)}
                    className="flex items-center justify-center"
                    disabled={isProcessing}
                  >
                    <HiPlus className="mr-2 h-4 w-4" />
                    カスタムリンクを追加
                  </Button>
                </div>
              </div>
            ) : (
              <DashboardSection>
                {isAddingCustom && (
                  <DashboardCard
                    title="新規カスタムリンク追加"
                    icon={<HiPlus className="h-5 w-5 text-gray-500" />}
                    className="mb-6"
                  >
                    <CustomLinkForm
                      key={`custom-form-${refreshKey}`}
                      onSuccess={handleCustomAddSuccess}
                    />
                    <div className="mt-4 flex justify-center">
                      <Button
                        variant="outline"
                        onClick={() => setIsAddingCustom(false)}
                        disabled={isProcessing}
                      >
                        キャンセル
                      </Button>
                    </div>
                  </DashboardCard>
                )}
                {customLinks.length > 0 && !isAddingCustom && (
                  <div className="flex justify-center mb-4">
                    <Button
                      onClick={() => setIsAddingCustom(true)}
                      className="flex items-center"
                      disabled={isProcessing}
                    >
                      <HiPlus className="mr-2 h-4 w-4" />
                      カスタムリンクを追加
                    </Button>
                  </div>
                )}
                {customLinks.length > 0 && (
                  <DashboardCard
                    title="登録済みカスタムリンク"
                    icon={<HiGlobeAlt className="h-5 w-5 text-gray-500" />}
                    description="ドラッグ＆ドロップで順番を変更できます"
                  >
                    <CustomLinkList
                      key={`custom-list-${refreshKey}-${customLinks.length}`}
                      links={customLinks}
                      onUpdate={handleUpdate}
                      onEdit={handleEditCustomLink}
                    />
                  </DashboardCard>
                )}
              </DashboardSection>
            )}
          </motion.div>
        </TabsContent>
      </Tabs>
      {/* SNSリンク編集ダイアログ */}
      <Dialog open={!!editingSnsId} onOpenChange={(open) => !open && setEditingSnsId(null)}>
        {editingSnsLink && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ImprovedSnsIcon
                  platform={editingSnsLink.platform as SnsPlatform}
                  size={20}
                  color="primary"
                />
                <span>
                  {SNS_METADATA[editingSnsLink.platform as SnsPlatform]?.name ||
                    editingSnsLink.platform}
                  を編集
                </span>
              </DialogTitle>
            </DialogHeader>
            <SnsLinkEditForm
              link={editingSnsLink}
              onCancel={() => setEditingSnsId(null)}
              onSuccess={handleEditSuccess}
            />
          </DialogContent>
        )}
      </Dialog>
      {/* カスタムリンク編集ダイアログ */}
      <Dialog open={!!editingCustomId} onOpenChange={(open) => !open && setEditingCustomId(null)}>
        {editingCustomLink && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <HiPencil className="mr-2 h-5 w-5 text-gray-500" />
                カスタムリンクを編集
              </DialogTitle>
            </DialogHeader>
            <CustomLinkEditForm
              link={editingCustomLink}
              onCancel={() => setEditingCustomId(null)}
              onSuccess={handleEditSuccess}
            />
          </DialogContent>
        )}
      </Dialog>
      {/* 処理中のオーバーレイ */}
      {isProcessing && (
        <div className="fixed inset-0 bg-white bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-3 shadow-lg border">
            <Spinner size="md" />
            <span className="text-gray-700 font-medium">処理中...</span>
          </div>
        </div>
      )}
    </div>
  );
}