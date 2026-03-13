// app/dashboard/partner/sales-tools/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Spinner } from '@/components/ui/Spinner';
import {
  HiDocumentText,
  HiClipboardCopy,
  HiPlus,
  HiTrash,
  HiQrcode,
  HiExternalLink,
  HiCheckCircle,
} from 'react-icons/hi';
import toast from 'react-hot-toast';

interface DemoAccount {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  profileSlug: string | null;
  profileViews: number;
}

interface PartnerBranding {
  brandName: string;
  primaryColor: string;
  companyName: string;
}

const SALES_SCRIPT = `【営業トーク台本】

■ 導入（30秒）
「お忙しいところお時間いただきありがとうございます。
弊社の法人向けデジタル名刺サービスについてご紹介させてください。」

■ 課題提起（1分）
「紙の名刺では、更新のたびに再印刷が必要ですし、
もらった名刺の管理も大変ですよね。
また、名刺交換の場でしか情報を渡せないという制限もあります。」

■ 解決策の提示（2分）
「弊社のデジタル名刺なら：
・NFCシールやQRコードでワンタップで名刺交換
・社員情報の一括管理・一括更新が可能
・プロフィールページへのアクセス数も確認可能
・御社ブランドでのカスタマイズも対応」

■ デモ（2分）
「実際にデモをお見せします。このQRコードを読み取ってみてください。
[デモアカウントのQRコードを提示]
このように、スマートフォンで簡単にプロフィールを確認できます。」

■ 料金案内（1分）
「料金プランは3つご用意しております：
・ベーシック：月額30,000円（300アカウントまで）
・プロ：月額50,000円（600アカウントまで）
・プレミアム：月額80,000円（1,000アカウントまで）
初期費用は100,000円で、導入サポートも含まれます。」

■ クロージング（30秒）
「まずは無料のトライアルからお試しいただけます。
ご興味があれば、すぐにデモ環境をご用意いたします。」`;

export default function SalesToolsPage() {
  const [demoAccounts, setDemoAccounts] = useState<DemoAccount[]>([]);
  const [branding, setBranding] = useState<PartnerBranding | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newDemoName, setNewDemoName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [scriptCopied, setScriptCopied] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [demoRes, brandingRes] = await Promise.all([
        fetch('/api/partner/demo-accounts'),
        fetch('/api/partner/branding'),
      ]);

      if (demoRes.ok) {
        const demoData = await demoRes.json();
        setDemoAccounts(demoData.demoAccounts);
      }

      if (brandingRes.ok) {
        const brandingData = await brandingRes.json();
        setBranding(brandingData.branding);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateDemo = async () => {
    if (!newDemoName.trim()) {
      toast.error('デモアカウント名を入力してください');
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch('/api/partner/demo-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newDemoName.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '作成に失敗しました');
      }

      toast.success('デモアカウントを作成しました');
      setNewDemoName('');
      await fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '作成に失敗しました');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteDemo = async (id: string) => {
    if (!confirm('このデモアカウントを削除しますか？')) return;

    try {
      const res = await fetch(`/api/partner/demo-accounts/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '削除に失敗しました');
      }

      toast.success('デモアカウントを削除しました');
      await fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '削除に失敗しました');
    }
  };

  const handleCopyScript = () => {
    const customScript = branding
      ? SALES_SCRIPT.replace(/弊社/g, branding.companyName || branding.brandName)
      : SALES_SCRIPT;
    navigator.clipboard.writeText(customScript);
    setScriptCopied(true);
    toast.success('台本をコピーしました');
    setTimeout(() => setScriptCopied(false), 2000);
  };

  const getProfileUrl = (slug: string) => {
    return `${window.location.origin}/${slug}`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">営業ツール</h1>
        <p className="text-gray-500">営業活動に使えるツールとデモアカウントを管理します</p>
      </div>

      {/* 提案概要セクション */}
      {branding && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <HiDocumentText className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold">提案概要</h2>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <p className="font-medium text-lg">{branding.brandName} デジタル名刺サービス</p>
            <p className="text-gray-600">
              {branding.companyName || branding.brandName}が提供する法人向けデジタル名刺ソリューションです。
              NFCシールやQRコードを活用して、スマートフォンで簡単にプロフィールを共有できます。
            </p>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-white rounded-lg p-3 border">
                <p className="text-sm text-gray-500">ベーシック</p>
                <p className="font-bold">月額 ¥30,000</p>
                <p className="text-xs text-gray-400">300アカウントまで</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-blue-200">
                <p className="text-sm text-blue-600">プロ（おすすめ）</p>
                <p className="font-bold">月額 ¥50,000</p>
                <p className="text-xs text-gray-400">600アカウントまで</p>
              </div>
              <div className="bg-white rounded-lg p-3 border">
                <p className="text-sm text-gray-500">プレミアム</p>
                <p className="font-bold">月額 ¥80,000</p>
                <p className="text-xs text-gray-400">1,000アカウントまで</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 営業トーク台本 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <HiClipboardCopy className="h-5 w-5 text-green-500" />
            <h2 className="text-lg font-semibold">営業トーク台本</h2>
          </div>
          <button
            onClick={handleCopyScript}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {scriptCopied ? (
              <>
                <HiCheckCircle className="h-4 w-4 text-green-500" />
                コピー済み
              </>
            ) : (
              <>
                <HiClipboardCopy className="h-4 w-4" />
                コピー
              </>
            )}
          </button>
        </div>
        <pre className="bg-gray-50 rounded-lg p-4 text-sm whitespace-pre-wrap font-sans text-gray-700 max-h-[400px] overflow-y-auto">
          {branding
            ? SALES_SCRIPT.replace(/弊社/g, branding.companyName || branding.brandName)
            : SALES_SCRIPT}
        </pre>
      </div>

      {/* デモアカウント管理 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <HiQrcode className="h-5 w-5 text-purple-500" />
          <h2 className="text-lg font-semibold">デモアカウント</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          営業時に見せるデモ用プロフィールを作成できます。デモアカウントはアカウント上限のカウントに含まれません。
        </p>

        {/* 新規作成フォーム */}
        <div className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="デモ用の名前（例：山田太郎）"
            value={newDemoName}
            onChange={(e) => setNewDemoName(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateDemo();
            }}
          />
          <button
            onClick={handleCreateDemo}
            disabled={isCreating}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <HiPlus className="h-4 w-4" />
            {isCreating ? '作成中...' : '作成'}
          </button>
        </div>

        {/* デモアカウント一覧 */}
        {demoAccounts.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <HiQrcode className="mx-auto h-10 w-10 mb-2" />
            <p>デモアカウントがありません</p>
          </div>
        ) : (
          <div className="space-y-3">
            {demoAccounts.map((demo) => (
              <div
                key={demo.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium">{demo.name}</p>
                  <p className="text-sm text-gray-500">
                    作成日: {new Date(demo.createdAt).toLocaleDateString('ja-JP')}
                    {demo.profileSlug && (
                      <span className="ml-3">閲覧数: {demo.profileViews}</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {demo.profileSlug && (
                    <a
                      href={getProfileUrl(demo.profileSlug)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <HiExternalLink className="h-4 w-4" />
                      プロフィール
                    </a>
                  )}
                  <button
                    onClick={() => handleDeleteDemo(demo.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <HiTrash className="h-4 w-4" />
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
