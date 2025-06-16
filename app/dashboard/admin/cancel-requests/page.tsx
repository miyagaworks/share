// app/dashboard/admin/cancel-requests/page.tsx
'use client';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Spinner } from '@/components/ui/Spinner';
import { HiCheck, HiX, HiExclamationCircle, HiEye } from 'react-icons/hi';

interface CancelRequest {
  id: string;
  user: {
    name: string | null;
    email: string;
  };
  requestedCancelDate: string;
  reason: string | null;
  currentPlan: string;
  currentInterval: string;
  paidAmount: number;
  refundAmount: number;
  usedMonths: number;
  status: string;
  createdAt: string;
  adminNotes: string | null;
}

export default function AdminCancelRequestsPage() {
  const [requests, setRequests] = useState<CancelRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<CancelRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  // 解約申請一覧取得
  const fetchCancelRequests = async () => {
    try {
      const response = await fetch('/api/admin/cancel-requests');
      if (!response.ok) throw new Error('データ取得に失敗しました');

      const data = await response.json();
      setRequests(data.requests);
    } catch (error) {
      toast.error('解約申請の取得に失敗しました');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 解約申請処理
  const handleProcessRequest = async (requestId: string, action: 'approve' | 'reject') => {
    if (!window.confirm(`この解約申請を${action === 'approve' ? '承認' : '却下'}しますか？`)) {
      return;
    }

    try {
      setProcessingId(requestId);

      const response = await fetch(`/api/admin/cancel-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          adminNotes: adminNotes.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '処理に失敗しました');
      }

      toast.success(`解約申請を${action === 'approve' ? '承認' : '却下'}しました`);
      setSelectedRequest(null);
      setAdminNotes('');
      fetchCancelRequests();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '処理に失敗しました');
    } finally {
      setProcessingId(null);
    }
  };

  useEffect(() => {
    fetchCancelRequests();
  }, []);

  // プラン表示名
  const getPlanDisplayName = (plan: string, interval: string) => {
    const intervalText = interval === 'year' ? '年額' : '月額';

    if (plan === 'monthly' || plan === 'yearly') {
      return `個人プラン（${intervalText}）`;
    }
    if (plan.includes('starter')) {
      return `法人スタータープラン（${intervalText}）`;
    }
    if (plan.includes('business')) {
      return `法人ビジネスプラン（${intervalText}）`;
    }
    if (plan.includes('enterprise')) {
      return `法人エンタープライズプラン（${intervalText}）`;
    }
    return `${plan}（${intervalText}）`;
  };

  // ステータス表示
  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      processed: 'bg-blue-100 text-blue-800',
    };

    const labels = {
      pending: '保留中',
      approved: '承認済み',
      rejected: '却下済み',
      processed: '処理完了',
    };

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}
      >
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-2 text-gray-500">解約申請を読み込んでいます...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[90vw] mx-auto">
      <div className="bg-gradient-to-r from-red-600 to-pink-700 rounded-lg p-6 mb-6 text-white">
        <div className="flex items-center">
          <HiExclamationCircle className="h-8 w-8 mr-3" />
          <h1 className="text-2xl font-bold">解約申請管理</h1>
        </div>
        <p className="mt-2 opacity-90">ユーザーからの解約申請を確認・処理します</p>
      </div>

      {/* 統計情報 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-1">総申請数</h3>
          <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-1">保留中</h3>
          <p className="text-2xl font-bold text-yellow-600">
            {requests.filter((r) => r.status === 'pending').length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-1">承認済み</h3>
          <p className="text-2xl font-bold text-green-600">
            {requests.filter((r) => r.status === 'approved').length}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-500 mb-1">総返金予定額</h3>
          <p className="text-2xl font-bold text-blue-600">
            ¥
            {requests
              .filter((r) => r.status === 'pending' || r.status === 'approved')
              .reduce((sum, r) => sum + r.refundAmount, 0)
              .toLocaleString()}
          </p>
        </div>
      </div>

      {/* 申請一覧 */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">解約申請一覧</h2>
        </div>

        {requests.length === 0 ? (
          <div className="p-8 text-center text-gray-500">解約申請はありません</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    ユーザー
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    プラン
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    解約希望日
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    返金額
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    ステータス
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    申請日
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">
                          {request.user.name || '未設定'}
                        </div>
                        <div className="text-sm text-gray-500">{request.user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {getPlanDisplayName(request.currentPlan, request.currentInterval)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(request.requestedCancelDate).toLocaleDateString('ja-JP')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      ¥{request.refundAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(request.status)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(request.createdAt).toLocaleDateString('ja-JP')}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedRequest(request)}
                        className="text-blue-600 hover:text-blue-800 mr-3"
                      >
                        <HiEye className="h-4 w-4" />
                      </button>
                      {request.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleProcessRequest(request.id, 'approve')}
                            disabled={processingId === request.id}
                            className="text-green-600 hover:text-green-800 disabled:opacity-50"
                          >
                            <HiCheck className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleProcessRequest(request.id, 'reject')}
                            disabled={processingId === request.id}
                            className="text-red-600 hover:text-red-800 disabled:opacity-50"
                          >
                            <HiX className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 詳細モーダル */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold">解約申請詳細</h3>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <HiX className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* ユーザー情報 */}
              <div>
                <h4 className="font-semibold mb-2">ユーザー情報</h4>
                <div className="bg-gray-50 p-3 rounded">
                  <p>
                    <strong>名前:</strong> {selectedRequest.user.name || '未設定'}
                  </p>
                  <p>
                    <strong>メール:</strong> {selectedRequest.user.email}
                  </p>
                </div>
              </div>

              {/* プラン情報 */}
              <div>
                <h4 className="font-semibold mb-2">プラン情報</h4>
                <div className="bg-gray-50 p-3 rounded">
                  <p>
                    <strong>プラン:</strong>{' '}
                    {getPlanDisplayName(
                      selectedRequest.currentPlan,
                      selectedRequest.currentInterval,
                    )}
                  </p>
                  <p>
                    <strong>支払い済み:</strong> ¥{selectedRequest.paidAmount.toLocaleString()}
                  </p>
                  <p>
                    <strong>利用月数:</strong> {selectedRequest.usedMonths}ヶ月
                  </p>
                  <p>
                    <strong>返金予定:</strong> ¥{selectedRequest.refundAmount.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* 解約情報 */}
              <div>
                <h4 className="font-semibold mb-2">解約情報</h4>
                <div className="bg-gray-50 p-3 rounded">
                  <p>
                    <strong>解約希望日:</strong>{' '}
                    {new Date(selectedRequest.requestedCancelDate).toLocaleDateString('ja-JP')}
                  </p>
                  <p>
                    <strong>申請日:</strong>{' '}
                    {new Date(selectedRequest.createdAt).toLocaleDateString('ja-JP')}
                  </p>
                  <p>
                    <strong>ステータス:</strong> {getStatusBadge(selectedRequest.status)}
                  </p>
                </div>
              </div>

              {/* 解約理由 */}
              {selectedRequest.reason && (
                <div>
                  <h4 className="font-semibold mb-2">解約理由</h4>
                  <div className="bg-gray-50 p-3 rounded">
                    <p>{selectedRequest.reason}</p>
                  </div>
                </div>
              )}

              {/* 管理者メモ */}
              {selectedRequest.status === 'pending' && (
                <div>
                  <h4 className="font-semibold mb-2">管理者メモ</h4>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="処理に関するメモを入力してください"
                  />
                </div>
              )}

              {/* 既存の管理者メモ */}
              {selectedRequest.adminNotes && (
                <div>
                  <h4 className="font-semibold mb-2">管理者メモ</h4>
                  <div className="bg-gray-50 p-3 rounded">
                    <p>{selectedRequest.adminNotes}</p>
                  </div>
                </div>
              )}

              {/* アクションボタン */}
              {selectedRequest.status === 'pending' && (
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => handleProcessRequest(selectedRequest.id, 'approve')}
                    disabled={processingId === selectedRequest.id}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {processingId === selectedRequest.id ? '処理中...' : '承認'}
                  </button>
                  <button
                    onClick={() => handleProcessRequest(selectedRequest.id, 'reject')}
                    disabled={processingId === selectedRequest.id}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    {processingId === selectedRequest.id ? '処理中...' : '却下'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}