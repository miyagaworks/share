// app/dashboard/admin/email/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui/Spinner';
import { toast } from 'react-hot-toast';
import {
  HiOutlineMail,
  HiOutlineInformationCircle,
  HiOutlineClipboardList,
} from 'react-icons/hi';

// 送信履歴の型定義
interface EmailHistory {
  id: string;
  subject: string;
  targetGroup: string;
  sentCount: number;
  failCount: number;
  sentAt: string;
}

export default function AdminEmailPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sending, setSending] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [emailHistory, setEmailHistory] = useState<EmailHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    title: '',
    message: '',
    targetGroup: 'all',
    ctaText: '',
    ctaUrl: '',
  });

  // ターゲットグループオプション
  const targetGroups = [
    { value: 'all', label: '全ユーザー' },
    { value: 'active', label: 'アクティブユーザー' },
    { value: 'trial', label: 'トライアルユーザー' },
    { value: 'permanent', label: '永久利用権ユーザー' },
    { value: 'individual', label: '個人プランユーザー（すべて）' },
    { value: 'individual_monthly', label: '個人プラン（月更新）' },
    { value: 'individual_yearly', label: '個人プラン（年更新）' },
    { value: 'corporate', label: '法人プランユーザー（管理者のみ）' },
    { value: 'corporate_monthly', label: '法人プラン（月更新）' },
    { value: 'corporate_yearly', label: '法人プラン（年更新）' },
    { value: 'inactive', label: '非アクティブユーザー' },
    { value: 'expired', label: '利用期限切れユーザー' },
  ];

  // 管理者チェック
  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!session?.user?.id) {
        router.push('/auth/signin');
        return;
      }

      try {
        const response = await fetch('/api/admin/access');
        const data = await response.json();

        if (data.isSuperAdmin) {
          setIsAdmin(true);
        } else {
          router.push('/dashboard');
        }
      } catch (error) {
        console.error('管理者チェックエラー:', error);
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccess();
  }, [session, router]);

  // 送信履歴の取得
  const fetchEmailHistory = async () => {
    setHistoryLoading(true);
    try {
      const response = await fetch('/api/admin/email/history');
      if (response.ok) {
        const data = await response.json();
        setEmailHistory(data.history || []);
      } else {
        console.error('送信履歴取得エラー');
        toast.error('送信履歴の取得に失敗しました');
      }
    } catch (error) {
      console.error('送信履歴取得エラー:', error);
      toast.error('送信履歴の取得中にエラーが発生しました');
    } finally {
      setHistoryLoading(false);
    }
  };

  // 履歴表示切り替え時に履歴を取得
  useEffect(() => {
    if (showHistory && emailHistory.length === 0) {
      fetchEmailHistory();
    }
  }, [showHistory, emailHistory.length]);

  // 入力フォームの変更ハンドラ
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // メール送信ハンドラ
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    try {
      const response = await fetch('/api/admin/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`メールを送信しました（${data.sentCount}/${data.totalCount}件成功）`);
        // フォームをリセット
        setFormData({
          subject: '',
          title: '',
          message: '',
          targetGroup: 'all',
          ctaText: '',
          ctaUrl: '',
        });

        // 履歴を更新
        if (showHistory) {
          fetchEmailHistory();
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'メール送信に失敗しました');
      }
    } catch (error) {
      console.error('メール送信エラー:', error);
      toast.error('処理中にエラーが発生しました');
    } finally {
      setSending(false);
    }
  };

  // ターゲットグループの表示名を取得
  const getTargetGroupLabel = (value: string) => {
    const group = targetGroups.find((g) => g.value === value);
    return group ? group.label : value;
  };

  // 日付フォーマット
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[300px]">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-2 text-gray-500">権限を確認中...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // リダイレクト処理中は表示なし
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* メール送信フォーム */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 sm:p-8 mb-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <HiOutlineMail className="h-6 w-6 text-blue-600 mr-4" />
            <h1 className="text-2xl font-bold">メール配信</h1>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowHistory(!showHistory);
              if (!showHistory && emailHistory.length === 0) {
                fetchEmailHistory();
              }
            }}
            className="inline-flex items-center px-4 py-2 text-base font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <HiOutlineClipboardList className="mr-2 h-5 w-5" />
            {showHistory ? '履歴を非表示' : '送信履歴を表示'}
          </button>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-5 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <HiOutlineInformationCircle className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-base text-yellow-700">
                このページからユーザーグループにメールを送信できます。すべてのユーザーに届くため、内容を十分確認してから送信してください。
              </p>
            </div>
          </div>
        </div>

        {/* 送信履歴セクション */}
        {showHistory && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">送信履歴</h2>

            {historyLoading ? (
              <div className="flex justify-center items-center py-8">
                <Spinner size="md" />
                <p className="ml-3 text-gray-500">履歴を読み込み中...</p>
              </div>
            ) : emailHistory.length === 0 ? (
              <div className="bg-gray-50 rounded-md p-5 text-center text-gray-500">
                <p>送信履歴はありません</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-base font-medium text-gray-500"
                      >
                        件名
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-base font-medium text-gray-500"
                      >
                        送信対象
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-base font-medium text-gray-500"
                      >
                        送信数
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-base font-medium text-gray-500"
                      >
                        送信日時
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {emailHistory.map((history) => (
                      <tr key={history.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-base text-gray-900">
                          {history.subject}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-base text-gray-900">
                          {getTargetGroupLabel(history.targetGroup)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-base text-gray-900">
                          {history.sentCount}
                          {history.failCount > 0 && (
                            <span className="text-red-500 ml-2">(失敗: {history.failCount})</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-base text-gray-900">
                          {formatDate(history.sentAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label htmlFor="targetGroup" className="block text-base font-medium text-gray-700 mb-2">
              送信対象
            </label>
            <select
              id="targetGroup"
              name="targetGroup"
              value={formData.targetGroup}
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-3 text-base"
              required
            >
              {targetGroups.map((group) => (
                <option key={group.value} value={group.value}>
                  {group.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="subject" className="block text-base font-medium text-gray-700 mb-2">
              件名
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-3 text-base"
              placeholder="メールの件名"
              required
            />
          </div>

          <div>
            <label htmlFor="title" className="block text-base font-medium text-gray-700 mb-2">
              タイトル
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-3 text-base"
              placeholder="メール本文内のタイトル"
              required
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-base font-medium text-gray-700 mb-2">
              本文
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={8}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-3 text-base"
              placeholder="メールの本文"
              required
            />
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Call To Action（オプション）</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="ctaText" className="block text-base font-medium text-gray-700 mb-2">
                  CTAボタンテキスト
                </label>
                <input
                  type="text"
                  id="ctaText"
                  name="ctaText"
                  value={formData.ctaText}
                  onChange={handleChange}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-3 text-base"
                  placeholder="今すぐ確認する"
                />
              </div>

              <div>
                <label htmlFor="ctaUrl" className="block text-base font-medium text-gray-700 mb-2">
                  CTAリンクURL
                </label>
                <input
                  type="url"
                  id="ctaUrl"
                  name="ctaUrl"
                  value={formData.ctaUrl}
                  onChange={handleChange}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-3 text-base"
                  placeholder="https://app.sns-share.com/dashboard"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={sending}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {sending ? (
                <>
                  <Spinner size="sm" className="mr-3" />
                  送信中...
                </>
              ) : (
                <>
                  <HiOutlineMail className="mr-3 h-5 w-5" />
                  メールを送信する
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}