// app/dashboard/admin/company-expenses/page.tsx (完全修正版)
'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Spinner } from '@/components/ui/Spinner';
import {
  HiPlus,
  HiPencil,
  HiTrash,
  HiSearch,
  HiFilter,
  HiDownload,
  HiDocumentText,
  HiCheckCircle,
  HiClock,
  HiExclamationCircle,
  HiCalendar,
  HiEye,
  HiCheck,
  HiX,
  HiInformationCircle,
  HiShieldCheck,
  HiChevronLeft,
  HiChevronRight,
} from 'react-icons/hi';

interface ContractorExpense {
  id: string;
  title: string;
  description?: string;
  amount: number;
  category: string;
  expenseDate: string;
  approvalStatus: 'pending' | 'approved' | 'rejected' | 'auto_approved';
  expenseType: string;
  isRecurring: boolean;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  requiresApproval: boolean;
  userType?: string; // 委託者/受託者の区別
}

// 🆕 管理者権限の型定義
interface AdminAccess {
  isSuperAdmin: boolean;
  isFinancialAdmin: boolean;
  adminLevel: 'super' | 'financial' | 'none';
}

export default function ExpenseManagementPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<ContractorExpense[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 🆕 管理者権限状態
  const [adminAccess, setAdminAccess] = useState<AdminAccess | null>(null);

  // フィルター・検索状態
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 🆕 経費詳細モーダル状態
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedExpenseDetail, setSelectedExpenseDetail] = useState<ContractorExpense | null>(
    null,
  );
  const [editingExpense, setEditingExpense] = useState<ContractorExpense | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // フォーム状態
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    category: 'operational',
    subCategory: '',
    expenseType: 'operational',
    expenseDate: new Date().toISOString().split('T')[0],
    isRecurring: false,
    recurringCycle: '',
    paymentMethod: '',
    invoiceNumber: '',
    receiptUrl: '',
    taxIncluded: true,
    taxRate: '',
  });

  // カテゴリー定義
  const categories = [
    { value: 'all', label: '全てのカテゴリー' },
    { value: 'operational', label: '運営費' },
    { value: 'marketing', label: '広告・マーケティング' },
    { value: 'system', label: 'システム・IT' },
    { value: 'legal', label: '法務・コンプライアンス' },
    { value: 'office', label: 'オフィス・設備' },
    { value: 'travel', label: '交通・出張' },
    { value: 'communication', label: '通信・インターネット' },
    { value: 'other', label: 'その他' },
  ];

  // ステータス定義
  const statusOptions = [
    { value: 'all', label: '全てのステータス' },
    { value: 'pending', label: '承認待ち' },
    { value: 'approved', label: '承認済み' },
    { value: 'auto_approved', label: '自動承認済み' },
    { value: 'rejected', label: '否認済み' },
  ];

  const APPROVAL_THRESHOLD = 5000;

  // メッセージ表示
  const showMessage = useCallback((type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }, []);

  // 経費一覧取得
  const loadExpenses = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        category: selectedCategory,
        status: selectedStatus,
        ...(dateRange.from && { fromDate: dateRange.from }),
        ...(dateRange.to && { toDate: dateRange.to }),
      });

      const response = await fetch(`/api/admin/company-expenses?${params}`);
      if (response.ok) {
        const data = await response.json();
        setExpenses(data.expenses || []);
        setSummary(data.summary || null);
        setTotalPages(data.pagination?.totalPages || 1);
      } else {
        showMessage('error', '経費データの取得に失敗しました');
      }
    } catch (error) {
      console.error('経費データ取得エラー:', error);
      showMessage('error', '経費データの取得に失敗しました');
    }
  }, [currentPage, selectedCategory, selectedStatus, dateRange, showMessage]);

  // 権限チェックとデータロード
  useEffect(() => {
    const checkPermissionAndLoadData = async () => {
      if (!session?.user?.id) {
        router.push('/auth/signin');
        return;
      }

      try {
        const accessResponse = await fetch('/api/admin/access');
        const accessData = await accessResponse.json();

        if (!accessData.isFinancialAdmin && !accessData.isSuperAdmin) {
          router.push('/dashboard');
          return;
        }

        // 🆕 管理者権限情報を保存
        setAdminAccess({
          isSuperAdmin: accessData.isSuperAdmin,
          isFinancialAdmin: accessData.isFinancialAdmin,
          adminLevel: accessData.adminLevel,
        });

        await loadExpenses();
      } catch (error) {
        console.error('権限チェックエラー:', error);
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    checkPermissionAndLoadData();
  }, [session, router, loadExpenses]);

  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.amount || !formData.category) {
      showMessage('error', 'タイトル、金額、カテゴリーは必須です');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (amount <= 0) {
      showMessage('error', '金額は0より大きい値を入力してください');
      return;
    }

    setActionLoading(true);
    try {
      const payload = {
        ...formData,
        amount,
        ...(editingExpense && { id: editingExpense.id }), // 🆕 編集時はIDを追加
      };

      const method = editingExpense ? 'PUT' : 'POST'; // 🆕 編集時はPUT
      const response = await fetch('/api/admin/company-expenses', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        const actionText = editingExpense ? '更新' : '登録'; // 🆕 編集時のメッセージ
        showMessage('success', result.message || `経費を${actionText}しました`);
        setIsModalOpen(false);
        setIsEditModalOpen(false); // 🆕 編集モーダルも閉じる
        setEditingExpense(null); // 🆕 編集状態をリセット
        resetForm();
        await loadExpenses();
      } else {
        showMessage('error', result.error || '操作に失敗しました');
      }
    } catch (error) {
      console.error('経費操作エラー:', error);
      showMessage('error', '操作に失敗しました');
    } finally {
      setActionLoading(false);
    }
  };

  // 🔒 修正: スーパー管理者のみ承認・否認可能
  const handleApprovalAction = async (expenseId: string, action: 'approve' | 'reject') => {
    // 🔒 重要: スーパー管理者のみ承認・否認可能
    if (!adminAccess?.isSuperAdmin) {
      showMessage('error', 'この操作にはスーパー管理者権限が必要です');
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch('/api/admin/company-expenses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: expenseId,
          action,
          approvedBy: session?.user?.id,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        const actionText = action === 'approve' ? '承認' : '否認';
        showMessage('success', `経費を${actionText}しました`);
        await loadExpenses();
      } else {
        showMessage('error', result.error || '操作に失敗しました');
      }
    } catch (error) {
      console.error('承認操作エラー:', error);
      showMessage('error', '操作に失敗しました');
    } finally {
      setActionLoading(false);
    }
  };

  // 🆕 削除機能の修正（承認済みでも削除可能、ただし警告強化）
  const handleDeleteExpense = async (expenseId: string, title: string, approvalStatus: string) => {
    // 🔒 スーパー管理者のみ削除可能
    if (!adminAccess?.isSuperAdmin) {
      showMessage('error', '削除にはスーパー管理者権限が必要です');
      return;
    }

    // 🚨 承認済み経費の削除時は特別な警告
    let confirmMessage = `「${title}」を削除しますか？\n\nこの操作は元に戻せません。`;

    if (approvalStatus === 'approved') {
      confirmMessage = `⚠️ 承認済み経費の削除\n\n「${title}」を削除しようとしています。\n\n承認済みの経費を削除すると、会計記録に影響する可能性があります。\n本当に削除しますか？\n\n※この操作は元に戻せません`;
    }

    // 確認ダイアログ
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch('/api/admin/company-expenses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: expenseId }),
      });

      const result = await response.json();

      if (response.ok) {
        showMessage('success', '経費を削除しました');
        await loadExpenses();
      } else {
        showMessage('error', result.error || '削除に失敗しました');
      }
    } catch (error) {
      console.error('削除エラー:', error);
      showMessage('error', '削除に失敗しました');
    } finally {
      setActionLoading(false);
    }
  };

  // 🆕 編集用のフォームデータを初期化する関数
  const initializeEditForm = (expense: ContractorExpense) => {
    setFormData({
      title: expense.title,
      description: expense.description || '',
      amount: expense.amount.toString(),
      category: expense.category,
      subCategory: '',
      expenseType: expense.expenseType,
      expenseDate: new Date(expense.expenseDate).toISOString().split('T')[0],
      isRecurring: expense.isRecurring,
      recurringCycle: '',
      paymentMethod: '',
      invoiceNumber: '',
      receiptUrl: '',
      taxIncluded: true,
      taxRate: '',
    });
  };

  // 🆕 編集ボタンのクリックハンドラー
  const handleEditExpense = (expense: ContractorExpense) => {
    setEditingExpense(expense);
    initializeEditForm(expense);
    setIsEditModalOpen(true);
  };

  // 🆕 経費詳細を表示する関数
  const handleViewExpenseDetail = (expense: ContractorExpense) => {
    setSelectedExpenseDetail(expense);
    setIsDetailModalOpen(true);
  };

  // フォームリセット
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      amount: '',
      category: 'operational',
      subCategory: '',
      expenseType: 'operational',
      expenseDate: new Date().toISOString().split('T')[0],
      isRecurring: false,
      recurringCycle: '',
      paymentMethod: '',
      invoiceNumber: '',
      receiptUrl: '',
      taxIncluded: true,
      taxRate: '',
    });
  };

  // ステータス表示用の関数
  const getStatusDisplay = (expense: ContractorExpense) => {
    switch (expense.approvalStatus) {
      case 'pending':
        return {
          icon: <HiClock className="h-4 w-4 text-yellow-500" />,
          text: '委託者承認待ち',
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-800',
        };
      case 'approved':
        return {
          icon: <HiCheckCircle className="h-4 w-4 text-green-500" />,
          text: expense.userType === '委託者' ? '委託者経費' : '委託者承認済み',
          bgColor: 'bg-green-50',
          textColor: 'text-green-800',
        };
      case 'auto_approved':
        return {
          icon: <HiCheckCircle className="h-4 w-4 text-blue-500" />,
          text: '自動承認済み',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-800',
        };
      case 'rejected':
        return {
          icon: <HiX className="h-4 w-4 text-red-500" />,
          text: '委託者否認',
          bgColor: 'bg-red-50',
          textColor: 'text-red-800',
        };
      default:
        return {
          icon: <HiExclamationCircle className="h-4 w-4 text-gray-500" />,
          text: '不明',
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-800',
        };
    }
  };

  // 承認必要性の表示
  const getApprovalRequirement = (amount: number) => {
    if (adminAccess?.isSuperAdmin) {
      return {
        message: '委託者経費のため承認不要です',
        color: 'text-green-600',
        icon: '✓',
      };
    } else {
      if (amount >= APPROVAL_THRESHOLD) {
        return {
          message: '5,000円以上のため委託者承認が必要です',
          color: 'text-orange-600',
          icon: '⚠️',
        };
      } else {
        return {
          message: '5,000円未満のため自動承認されます',
          color: 'text-blue-600',
          icon: '✓',
        };
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ヘッダーセクション */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center mb-2">
              <HiDocumentText className="h-8 w-8 mr-3" />
              <h1 className="text-3xl font-bold">経費管理</h1>
              {/* 🆕 権限レベル表示 */}
              <span className="ml-3 bg-white/20 px-3 py-1 rounded-full text-sm flex items-center">
                <HiShieldCheck className="h-4 w-4 mr-1" />
                {adminAccess?.isSuperAdmin ? 'スーパー管理者' : '財務管理者'}
              </span>
            </div>
            <p className="text-blue-100">
              {adminAccess?.isSuperAdmin
                ? '委託者・受託者の経費を管理します'
                : '経費データの閲覧・管理を行います'}
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center"
          >
            <HiPlus className="h-5 w-5 mr-2" />
            経費を追加
          </button>
        </div>
      </div>

      {/* 🔧 権限別説明メッセージ */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <HiInformationCircle className="h-5 w-5 text-amber-500 mt-0.5 mr-3" />
          <div>
            <h3 className="font-semibold text-amber-800 mb-1">
              {adminAccess?.isSuperAdmin ? '承認ルール' : '財務管理者権限について'}
            </h3>
            {adminAccess?.isSuperAdmin ? (
              <p className="text-amber-700 text-sm">
                • <strong>委託者経費</strong>：承認不要で即座に登録されます
                <br />• <strong>受託者経費</strong>：5,000円以上は委託者承認が必要です
                <br />• <strong>承認・否認</strong>：スーパー管理者として承認・否認操作が可能です
              </p>
            ) : (
              <p className="text-amber-700 text-sm">
                • <strong>閲覧権限</strong>：全ての経費データを確認できます
                <br />• <strong>登録権限</strong>：新しい経費を登録できます
                <br />• <strong>承認権限</strong>：承認・否認操作はスーパー管理者のみ可能です
              </p>
            )}
          </div>
        </div>
      </div>

      {/* メッセージ表示 */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* サマリーカード */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">総経費</p>
                <p className="text-2xl font-bold text-gray-900">
                  ¥{summary.totalAmount.toLocaleString()}
                </p>
              </div>
              <HiDocumentText className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">承認待ち</p>
                <p className="text-2xl font-bold text-yellow-600">
                  ¥{summary.pendingAmount.toLocaleString()}
                </p>
              </div>
              <HiClock className="h-8 w-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">承認済み</p>
                <p className="text-2xl font-bold text-green-600">
                  ¥{summary.approvedAmount.toLocaleString()}
                </p>
              </div>
              <HiCheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">自動承認</p>
                <p className="text-2xl font-bold text-blue-600">
                  ¥{(summary.autoApprovedAmount || 0).toLocaleString()}
                </p>
              </div>
              <HiCheckCircle className="h-8 w-8 text-blue-500" />
            </div>
          </div>
        </div>
      )}

      {/* フィルター・検索セクション */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">経費一覧</h2>
          <div className="flex space-x-2">
            <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center">
              <HiDownload className="h-4 w-4 mr-2" />
              エクスポート
            </button>
          </div>
        </div>

        {/* フィルター */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">カテゴリー</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ステータス</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {statusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">開始日</label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">終了日</label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 経費一覧テーブル */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  経費情報
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  金額
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  カテゴリー
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  作成日
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {expenses.map((expense) => {
                const statusDisplay = getStatusDisplay(expense);
                return (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">{expense.title}</div>
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {expense.userType}
                          </span>
                        </div>
                        {expense.description && (
                          <div className="text-sm text-gray-500 mt-1">{expense.description}</div>
                        )}
                        <div className="text-xs text-gray-400 mt-1">
                          作成者: {expense.createdBy}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ¥{expense.amount.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(expense.expenseDate).toLocaleDateString('ja-JP')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {categories.find((c) => c.value === expense.category)?.label ||
                          expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusDisplay.bgColor} ${statusDisplay.textColor}`}
                      >
                        {statusDisplay.icon}
                        <span className="ml-1">{statusDisplay.text}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(expense.createdAt).toLocaleDateString('ja-JP')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {/* 🔒 承認・否認ボタン（スーパー管理者かつ承認待ちの場合のみ表示） */}
                      {adminAccess?.isSuperAdmin && expense.approvalStatus === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprovalAction(expense.id, 'approve')}
                            disabled={actionLoading}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                          >
                            <HiCheck className="h-3 w-3 mr-1" />
                            承認
                          </button>
                          <button
                            onClick={() => handleApprovalAction(expense.id, 'reject')}
                            disabled={actionLoading}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                          >
                            <HiX className="h-3 w-3 mr-1" />
                            否認
                          </button>
                        </>
                      )}

                      {/* 🔧 修正: 詳細表示ボタン（機能実装） */}
                      <button
                        onClick={() => handleViewExpenseDetail(expense)}
                        className="text-blue-600 hover:text-blue-900"
                        title="詳細を表示"
                      >
                        <HiEye className="h-4 w-4" />
                      </button>

                      {/* 🆕 編集ボタン（財務管理者以上、承認済み以外） */}
                      {(adminAccess?.isSuperAdmin || adminAccess?.isFinancialAdmin) &&
                        expense.approvalStatus !== 'approved' && (
                          <button
                            onClick={() => handleEditExpense(expense)}
                            className="text-indigo-600 hover:text-indigo-900 p-2 rounded-lg hover:bg-indigo-50 disabled:opacity-50"
                            title="編集"
                          >
                            <HiPencil className="h-4 w-4" />
                          </button>
                        )}

                      {/* 🔧 修正: 削除ボタン（スーパー管理者なら全ステータス削除可能） */}
                      {adminAccess?.isSuperAdmin && (
                        <button
                          onClick={() =>
                            handleDeleteExpense(expense.id, expense.title, expense.approvalStatus)
                          }
                          disabled={actionLoading}
                          className="inline-flex items-center px-2 py-1 border border-transparent text-xs leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                          title="経費を削除"
                        >
                          <HiTrash className="h-3 w-3" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ペジネーション */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              前へ
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              次へ
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                <span className="font-medium">{(currentPage - 1) * 20 + 1}</span> から{' '}
                <span className="font-medium">{Math.min(currentPage * 20, expenses.length)}</span>{' '}
                まで 表示中
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <HiChevronLeft className="h-5 w-5" />
                </button>
                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <HiChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* モーダル：経費追加・編集 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingExpense ? '経費を編集' : '新しい経費を追加'}
                {/* 権限表示 */}
                <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {adminAccess?.isSuperAdmin ? '委託者経費' : '経費登録'}
                </span>
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingExpense(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <HiX className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    タイトル <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="経費のタイトルを入力"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    金額 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                    min="0"
                    step="1"
                    required
                  />
                  {/* 承認必要性の表示 */}
                  {parseFloat(formData.amount) > 0 && (
                    <p
                      className={`mt-1 text-sm ${getApprovalRequirement(parseFloat(formData.amount)).color}`}
                    >
                      {getApprovalRequirement(parseFloat(formData.amount)).icon}{' '}
                      {getApprovalRequirement(parseFloat(formData.amount)).message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    カテゴリー <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    {categories
                      .filter((c) => c.value !== 'all')
                      .map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    発生日 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.expenseDate}
                    onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">説明</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="経費の詳細を入力（任意）"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingExpense(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {actionLoading && <Spinner size="sm" className="mr-2" />}
                  {editingExpense ? '更新' : '登録'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🆕 経費詳細モーダル */}
      {isDetailModalOpen && selectedExpenseDetail && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">経費詳細</h3>
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedExpenseDetail(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <HiX className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* 基本情報 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">タイトル</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {selectedExpenseDetail.title}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">金額</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    ¥{selectedExpenseDetail.amount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">カテゴリー</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {categories.find((c) => c.value === selectedExpenseDetail.category)?.label ||
                      selectedExpenseDetail.category}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">発生日</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {new Date(selectedExpenseDetail.expenseDate).toLocaleDateString('ja-JP')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
                  <div className="flex items-center">
                    {(() => {
                      const statusDisplay = getStatusDisplay(selectedExpenseDetail);
                      return (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusDisplay.bgColor} ${statusDisplay.textColor}`}
                        >
                          {statusDisplay.icon}
                          <span className="ml-1">{statusDisplay.text}</span>
                        </span>
                      );
                    })()}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ユーザータイプ
                  </label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {selectedExpenseDetail.userType}
                  </p>
                </div>
              </div>

              {/* 説明 */}
              {selectedExpenseDetail.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">説明</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded min-h-[60px]">
                    {selectedExpenseDetail.description}
                  </p>
                </div>
              )}

              {/* 詳細情報 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">作成者</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {selectedExpenseDetail.createdBy}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">作成日</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                    {new Date(selectedExpenseDetail.createdAt).toLocaleDateString('ja-JP')}
                  </p>
                </div>
                {selectedExpenseDetail.approvedBy && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">承認者</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                        {selectedExpenseDetail.approvedBy}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">承認日</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                        {selectedExpenseDetail.approvedAt
                          ? new Date(selectedExpenseDetail.approvedAt).toLocaleDateString('ja-JP')
                          : '-'}
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* 承認必要性 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">承認要件</label>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-900">
                    {selectedExpenseDetail.requiresApproval ? '承認が必要な経費' : '承認不要の経費'}
                  </p>
                  {selectedExpenseDetail.amount >= 5000 &&
                    selectedExpenseDetail.userType === '受託者' && (
                      <p className="text-xs text-orange-600 mt-1">
                        ⚠️ 5,000円以上の受託者経費のため承認が必要です
                      </p>
                    )}
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setIsDetailModalOpen(false);
                  setSelectedExpenseDetail(null);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 🆕 編集モーダル */}
      {isEditModalOpen && editingExpense && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                経費を編集
                {/* 権限表示 */}
                <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {adminAccess?.isSuperAdmin ? '委託者経費' : '経費編集'}
                </span>
              </h3>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingExpense(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <HiX className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    タイトル <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="経費のタイトルを入力"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    金額 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                    min="0"
                    step="1"
                    required
                  />
                  {/* 承認必要性の表示 */}
                  {parseFloat(formData.amount) > 0 && (
                    <p
                      className={`mt-1 text-sm ${getApprovalRequirement(parseFloat(formData.amount)).color}`}
                    >
                      {getApprovalRequirement(parseFloat(formData.amount)).icon}{' '}
                      {getApprovalRequirement(parseFloat(formData.amount)).message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    カテゴリー <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    {categories
                      .filter((c) => c.value !== 'all')
                      .map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    発生日 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.expenseDate}
                    onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">説明</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="経費の詳細を入力（任意）"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingExpense(null);
                    resetForm();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {actionLoading && <Spinner size="sm" className="mr-2" />}
                  更新
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}