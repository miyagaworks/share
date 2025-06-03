// app/api/admin/users/export/route.ts
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isAdminUser } from '@/lib/utils/admin-access-server';
import { addDays } from 'date-fns';
import { logger } from '@/lib/utils/logger';

interface ExportFilters {
  planStatus?: string[];
  startDate?: string;
  endDate?: string;
  searchTerm?: string;
  sortType?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // 管理者チェック
    const isAdmin = await isAdminUser(session.user.id);
    if (!isAdmin) {
      return NextResponse.json({ error: '管理者権限がありません' }, { status: 403 });
    }

    const body = await request.json();
    const filters: ExportFilters = body.filters || {};
    const isPreview = body.preview || false; // プレビューモードかどうか

    // すべてのユーザーを取得
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        nameKana: true,
        email: true,
        createdAt: true,
        updatedAt: true,
        trialEndsAt: true,
        phone: true,
        company: true,
        subscription: {
          select: {
            status: true,
            plan: true,
            currentPeriodEnd: true,
          },
        },
        subscriptionStatus: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();

    // ユーザーデータの整形とフィルタリング
    let filteredUsers = users.map((user) => {
      const isGracePeriodExpired = user.trialEndsAt
        ? now > addDays(new Date(user.trialEndsAt), 7)
        : false;
      const isPermanentUser = user.subscriptionStatus === 'permanent';

      return {
        ...user,
        isPermanentUser,
        isGracePeriodExpired,
      };
    });

    // フィルタリング適用
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      filteredUsers = filteredUsers.filter(
        (user) =>
          user.name?.toLowerCase().includes(searchTerm) ||
          user.email.toLowerCase().includes(searchTerm),
      );
    }

    if (filters.planStatus && filters.planStatus.length > 0) {
      filteredUsers = filteredUsers.filter((user) => {
        if (filters.planStatus!.includes('permanent') && user.isPermanentUser) return true;
        if (filters.planStatus!.includes('active') && user.subscription?.status === 'active')
          return true;
        if (filters.planStatus!.includes('expired') && user.isGracePeriodExpired) return true;
        if (filters.planStatus!.includes('trial') && user.trialEndsAt && !user.isGracePeriodExpired)
          return true;
        if (filters.planStatus!.includes('none') && !user.subscription && !user.trialEndsAt)
          return true;
        return false;
      });
    }

    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filteredUsers = filteredUsers.filter((user) => new Date(user.createdAt) >= startDate);
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999); // 終日まで含める
      filteredUsers = filteredUsers.filter((user) => new Date(user.createdAt) <= endDate);
    }

    // 並び替え
    if (filters.sortType) {
      filteredUsers.sort((a, b) => {
        switch (filters.sortType) {
          case 'created_desc':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case 'created_asc':
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          case 'nameKana_asc':
            return (a.nameKana || '').localeCompare(b.nameKana || '');
          case 'nameKana_desc':
            return (b.nameKana || '').localeCompare(a.nameKana || '');
          case 'email_asc':
            return a.email.localeCompare(b.email);
          case 'email_desc':
            return b.email.localeCompare(a.email);
          case 'grace_period':
          default:
            if (a.isGracePeriodExpired && !b.isGracePeriodExpired) return -1;
            if (!a.isGracePeriodExpired && b.isGracePeriodExpired) return 1;
            return (a.nameKana || '').localeCompare(b.nameKana || '');
        }
      });
    }

    // プレビューモードの場合は件数のみ返す
    if (isPreview) {
      return NextResponse.json({ count: filteredUsers.length });
    }

    // CSVデータの生成
    const csvHeaders = [
      'ユーザーID',
      'ユーザー名',
      'フリガナ',
      'メールアドレス',
      '電話番号',
      '会社名',
      '登録日',
      '更新日',
      'プラン状態',
      'サブスクリプションプラン',
      'サブスクリプション期限',
      'トライアル期限',
      '永久利用権',
      '猶予期間切れ',
    ];

    const csvRows = filteredUsers.map((user) => {
      const getPlanStatus = () => {
        if (user.isGracePeriodExpired) return '猶予期間終了';
        if (user.isPermanentUser) return '永久利用権';
        if (user.subscription?.status === 'active') return '有効';
        if (user.trialEndsAt) return 'トライアル';
        return 'なし';
      };

      const formatDate = (date: Date | string | null) => {
        if (!date) return '';
        return new Date(date).toLocaleDateString('ja-JP');
      };

      return [
        user.id,
        user.name || '',
        user.nameKana || '',
        user.email,
        user.phone || '',
        user.company || '',
        formatDate(user.createdAt),
        formatDate(user.updatedAt),
        getPlanStatus(),
        user.subscription?.plan || '',
        formatDate(user.subscription?.currentPeriodEnd || null),
        formatDate(user.trialEndsAt),
        user.isPermanentUser ? 'はい' : 'いいえ',
        user.isGracePeriodExpired ? 'はい' : 'いいえ',
      ];
    });

    // CSV形式に変換
    const csvContent = [csvHeaders, ...csvRows]
      .map((row) => row.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    // BOMを付加してUTF-8で正しく表示されるようにする
    const bom = '\uFEFF';
    const csvWithBom = bom + csvContent;

    const fileName = `users_export_${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csvWithBom, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    logger.error('ユーザーエクスポートエラー:', error);
    return NextResponse.json({ error: 'エクスポート処理に失敗しました' }, { status: 500 });
  }
}