// app/api/admin/company-expenses/route.ts (本番メール対応版)
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { checkAdminPermission, isSuperAdmin } from '@/lib/utils/admin-access-server';
// 🔧 修正: 本番メール送信機能を import
import { sendExpenseApprovalEmail, sendExpenseApprovalResultEmail } from '@/lib/email/index';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/utils/logger';

// 委託者経費一覧取得（財務管理者権限以上必要）
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // 財務管理者権限以上をチェック
    const hasPermission = await checkAdminPermission(session.user.id, 'financial');
    if (!hasPermission) {
      return NextResponse.json({ error: '財務管理者権限が必要です' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || '';
    const fromDate = searchParams.get('fromDate') || '';
    const toDate = searchParams.get('toDate') || '';

    // 検索条件構築を明確化
    const whereConditions: any = {
      recordType: {
        in: ['company_expense', 'contractor_expense'],
      },
    };

    if (category && category !== 'all') {
      whereConditions.category = category;
    }

    if (status && status !== 'all') {
      whereConditions.approvalStatus = status;
    }

    if (fromDate || toDate) {
      whereConditions.recordDate = {};
      if (fromDate) whereConditions.recordDate.gte = new Date(fromDate);
      if (toDate) whereConditions.recordDate.lte = new Date(toDate + 'T23:59:59.999Z');
    }

    // データ取得
    const skip = (page - 1) * limit;
    const [expenses, totalCount, summary] = await Promise.all([
      prisma.financialRecord.findMany({
        where: whereConditions,
        include: {
          creator: { select: { name: true, email: true } },
          approver: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.financialRecord.count({
        where: whereConditions,
      }),
      prisma.financialRecord.aggregate({
        where: whereConditions,
        _sum: { amount: true },
      }),
    ]);

    // ステータス別サマリー計算
    const [pendingSum, approvedSum, autoApprovedSum, rejectedSum] = await Promise.all([
      prisma.financialRecord.aggregate({
        where: { ...whereConditions, approvalStatus: 'pending' },
        _sum: { amount: true },
      }),
      prisma.financialRecord.aggregate({
        where: { ...whereConditions, approvalStatus: 'approved' },
        _sum: { amount: true },
      }),
      prisma.financialRecord.aggregate({
        where: { ...whereConditions, approvalStatus: 'auto_approved' },
        _sum: { amount: true },
      }),
      prisma.financialRecord.aggregate({
        where: { ...whereConditions, approvalStatus: 'rejected' },
        _sum: { amount: true },
      }),
    ]);

    // カテゴリー別集計
    const categoryBreakdown = await prisma.financialRecord.groupBy({
      by: ['category'],
      where: whereConditions,
      _sum: { amount: true },
      _count: true,
    });

    // レスポンス整形を詳細化
    const formattedExpenses = expenses.map((expense: any) => ({
      id: expense.id,
      title: expense.title,
      description: expense.description,
      amount: Number(expense.amount),
      category: expense.category,
      expenseDate: expense.recordDate.toISOString(),
      approvalStatus: expense.approvalStatus,
      expenseType: expense.recordType === 'company_expense' ? 'company' : 'contractor',
      isRecurring: false,
      createdBy: expense.creator?.name || expense.creator?.email || '不明',
      approvedBy: expense.approver?.name || expense.approver?.email || null,
      approvedAt: expense.approvedAt?.toISOString() || null,
      createdAt: expense.createdAt.toISOString(),
      requiresApproval:
        expense.recordType === 'contractor_expense' && Number(expense.amount) >= 5000,
      userType: expense.recordType === 'company_expense' ? '委託者' : '受託者',
      canDelete: true, // 実際の削除権限はAPI側でチェック
    }));

    return NextResponse.json({
      success: true,
      expenses: formattedExpenses,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      summary: {
        totalAmount: Number(summary._sum.amount || 0),
        pendingAmount: Number(pendingSum._sum.amount || 0),
        approvedAmount: Number(approvedSum._sum.amount || 0),
        autoApprovedAmount: Number(autoApprovedSum._sum.amount || 0),
        rejectedAmount: Number(rejectedSum._sum.amount || 0),
        categoryBreakdown: categoryBreakdown.map((cat: any) => ({
          category: cat.category,
          amount: Number(cat._sum.amount || 0),
          count: cat._count,
        })),
      },
    });
  } catch (error: any) {
    logger.error('経費一覧取得エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: '経費一覧の取得に失敗しました',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}

// 委託者経費登録（財務管理者権限以上必要）
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // 財務管理者権限以上をチェック
    const hasPermission = await checkAdminPermission(session.user.id, 'financial');
    if (!hasPermission) {
      return NextResponse.json({ error: '財務管理者権限が必要です' }, { status: 403 });
    }

    // ユーザー情報取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        email: true,
        name: true,
        subscriptionStatus: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    const body = await request.json();
    const {
      title,
      description,
      amount,
      category,
      subCategory,
      expenseType,
      expenseDate,
      isRecurring,
      recurringCycle,
      paymentMethod,
      invoiceNumber,
      receiptUrl,
      attachmentUrls,
      taxIncluded,
      taxRate,
    } = body;

    // 入力検証
    if (!title || !amount || !category || !expenseDate) {
      return NextResponse.json(
        { error: 'タイトル、金額、カテゴリ、発生日は必須です' },
        { status: 400 },
      );
    }

    if (amount <= 0) {
      return NextResponse.json({ error: '金額は0より大きい値を入力してください' }, { status: 400 });
    }

    // 承認ロジックの明確化
    const userIsSuperAdmin = await isSuperAdmin(session.user.id);
    const APPROVAL_THRESHOLD = 5000;

    let needsApproval = false;
    let finalApprovalStatus = 'approved';
    let recordType = 'company_expense';

    if (userIsSuperAdmin) {
      // スーパー管理者の場合：常に委託者経費として承認不要
      needsApproval = false;
      finalApprovalStatus = 'approved';
      recordType = 'company_expense';
    } else {
      // 財務管理者の場合：受託者経費として処理、5000円以上は承認必要
      needsApproval = amount >= APPROVAL_THRESHOLD;
      finalApprovalStatus = needsApproval ? 'pending' : 'auto_approved';
      recordType = 'contractor_expense';
    }

    const processedTaxRate = taxRate && taxRate !== '' ? parseFloat(taxRate) : null;

    // トランザクションで経費を登録
    const expense = await prisma.$transaction(async (tx: any) => {
      // 1. CompanyExpenseレコード作成
      const companyExpense = await tx.companyExpense.create({
        data: {
          title,
          description: description || '',
          amount: parseFloat(amount),
          category,
          subCategory: subCategory || '',
          expenseDate: new Date(expenseDate),
          expenseType: expenseType || 'operational',
          isRecurring: isRecurring || false,
          recurringCycle: recurringCycle || '',
          requiresApproval: needsApproval,
          approvalStatus: finalApprovalStatus,
          paymentMethod: paymentMethod || '',
          invoiceNumber: invoiceNumber || '',
          receiptUrl: receiptUrl || '',
          attachmentUrls: attachmentUrls ? JSON.stringify(attachmentUrls) : null,
          taxIncluded: taxIncluded !== false,
          taxRate: processedTaxRate,
          inputBy: session.user.id,
          ...((finalApprovalStatus === 'approved' || finalApprovalStatus === 'auto_approved') && {
            approvedBy: session.user.id,
            approvedAt: new Date(),
          }),
        },
      });

      // 2. FinancialRecordレコード作成
      const financialRecord = await tx.financialRecord.create({
        data: {
          recordType,
          title,
          description: description || '',
          amount: parseFloat(amount),
          category,
          recordDate: new Date(expenseDate),
          type: 'expense',
          needsApproval: needsApproval,
          approvalStatus: finalApprovalStatus,
          createdBy: session.user.id,
          date: new Date(expenseDate),
          contractorId: userIsSuperAdmin ? null : session.user.id,
          sourceType: 'manual',
          isAutoImported: false,
          inputBy: session.user.id,
          ...((finalApprovalStatus === 'approved' || finalApprovalStatus === 'auto_approved') && {
            approvedBy: session.user.id,
            approvedAt: new Date(),
          }),
        },
      });

      // 3. リレーション更新
      await tx.companyExpense.update({
        where: { id: companyExpense.id },
        data: { financialRecordId: financialRecord.id },
      });

      return { companyExpense, financialRecord };
    });

    // 🔥 承認が必要な場合は委託者にメール送信
    if (needsApproval && !userIsSuperAdmin) {
      try {
        // 🔧 修正: スーパー管理者のメールアドレス取得
        const superAdmin = await prisma.user.findFirst({
          where: { email: 'admin@sns-share.com' },
          select: { email: true, name: true },
        });

        if (superAdmin) {
          await sendExpenseApprovalEmail({
            expenseId: expense.companyExpense.id,
            title,
            amount: parseFloat(amount),
            category,
            submitterName: user.name || 'ユーザー',
            submitterEmail: user.email,
            description,
            expenseDate: new Date(expenseDate).toLocaleDateString('ja-JP'),
            approverEmail: superAdmin.email, // 🔧 修正: 委託者のメールアドレス
          });

          logger.info('経費承認メール送信成功:', {
            expenseId: expense.companyExpense.id,
            submitter: user.email,
            approver: superAdmin.email,
          });
        }
      } catch (emailError) {
        logger.error('経費承認メール送信エラー:', emailError);
        // メール送信エラーでも処理は続行
      }
    }

    const userType = userIsSuperAdmin ? '委託者' : '受託者';
    logger.info(`${userType}経費登録成功:`, {
      userId: session.user.id,
      userType,
      expenseId: expense.companyExpense.id,
      amount: parseFloat(amount),
      category,
      needsApproval,
      approvalStatus: finalApprovalStatus,
    });

    let statusMessage;
    if (userIsSuperAdmin) {
      statusMessage = '委託者経費として登録されました（承認不要）';
    } else {
      statusMessage = needsApproval ? '委託者承認待ちとして登録されました' : '自動承認されました';
    }

    return NextResponse.json({
      success: true,
      message: `${userType}経費を登録しました（${statusMessage}）`,
      data: {
        id: expense.companyExpense.id,
        financialRecordId: expense.financialRecord.id,
        title,
        amount: parseFloat(amount),
        category,
        approvalStatus: expense.companyExpense.approvalStatus,
        requiresApproval: needsApproval,
        userType,
        emailSent: needsApproval && !userIsSuperAdmin,
      },
    });
  } catch (error: any) {
    logger.error('経費登録エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: '経費の登録に失敗しました',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}

// 経費承認・否認（スーパー管理者のみ）
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // スーパー管理者権限をチェック
    const userIsSuperAdmin = await isSuperAdmin(session.user.id);
    if (!userIsSuperAdmin) {
      return NextResponse.json(
        { error: '承認・否認操作にはスーパー管理者権限が必要です' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { id, action, rejectionReason } = body;

    if (!id || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'ID、アクション（approve/reject）は必須です' },
        { status: 400 },
      );
    }

    // 承認者情報を取得
    const approver = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true },
    });

    const approvalStatus = action === 'approve' ? 'approved' : 'rejected';

    // FinancialRecord.idを使って処理
    const updatedExpense = await prisma.$transaction(async (tx: any) => {
      // 1. FinancialRecordを取得して更新
      const financialRecord = await tx.financialRecord.findUnique({
        where: { id }, // これがFinancialRecord.id
        include: {
          creator: { select: { name: true, email: true } },
        },
      });

      if (!financialRecord) {
        throw new Error('経費が見つかりません');
      }

      // 2. FinancialRecordを更新
      const updatedFinancialRecord = await tx.financialRecord.update({
        where: { id },
        data: {
          approvalStatus,
          approvedBy: session.user.id,
          approvedAt: new Date(),
        },
      });

      // 3. 関連するCompanyExpenseを financialRecordId で検索・更新
      const companyExpense = await tx.companyExpense.findFirst({
        where: { financialRecordId: id }, // financialRecordIdで検索
      });

      if (companyExpense) {
        await tx.companyExpense.update({
          where: { id: companyExpense.id }, // CompanyExpense.idで更新
          data: {
            approvalStatus,
            approvedBy: session.user.id,
            approvedAt: new Date(),
            rejectionReason: action === 'reject' ? rejectionReason : null,
          },
        });
      }

      return {
        id: updatedFinancialRecord.id,
        title: updatedFinancialRecord.title,
        amount: updatedFinancialRecord.amount,
        category: updatedFinancialRecord.category,
        approvalStatus: updatedFinancialRecord.approvalStatus,
        inputByUser: financialRecord.creator,
        companyExpenseId: companyExpense?.id,
      };
    });

    // 🔥 申請者にメール送信
    if (updatedExpense.inputByUser?.email) {
      try {
        await sendExpenseApprovalResultEmail({
          title: updatedExpense.title,
          amount: Number(updatedExpense.amount),
          category: updatedExpense.category,
          expenseDate: new Date().toLocaleDateString('ja-JP'),
          approvalStatus: approvalStatus as 'approved' | 'rejected',
          approverName: approver?.name || '管理者',
          submitterName: updatedExpense.inputByUser.name || 'ユーザー',
          submitterEmail: updatedExpense.inputByUser.email,
          rejectionReason,
        });

        logger.info('経費承認結果メール送信成功:', {
          financialRecordId: id,
          companyExpenseId: updatedExpense.companyExpenseId,
          action,
          submitter: updatedExpense.inputByUser.email,
        });
      } catch (emailError) {
        logger.error('経費承認結果メール送信エラー:', emailError);
        // メール送信エラーでも処理は続行
      }
    }

    logger.info('経費承認処理完了:', {
      userId: session.user.id,
      financialRecordId: id,
      companyExpenseId: updatedExpense.companyExpenseId,
      action,
      approvalStatus,
    });

    const actionText = action === 'approve' ? '承認' : '否認';
    return NextResponse.json({
      success: true,
      message: `経費を${actionText}しました`,
      data: {
        id: updatedExpense.id,
        approvalStatus: updatedExpense.approvalStatus,
        emailSent: !!updatedExpense.inputByUser?.email,
      },
    });
  } catch (error: any) {
    logger.error('経費承認処理エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: '承認処理に失敗しました',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}

// 経費削除（スーパー管理者のみ）
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // スーパー管理者権限をチェック
    const userIsSuperAdmin = await isSuperAdmin(session.user.id);
    if (!userIsSuperAdmin) {
      return NextResponse.json(
        { error: '経費削除にはスーパー管理者権限が必要です' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: '経費IDが必要です' }, { status: 400 });
    }

    // FinancialRecordから削除対象を特定
    const financialRecord = await prisma.financialRecord.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        amount: true,
        recordType: true,
        approvalStatus: true,
      },
    });

    if (!financialRecord) {
      return NextResponse.json({ error: '削除対象の経費が見つかりません' }, { status: 404 });
    }

    // 関連するCompanyExpenseを検索
    const companyExpense = await prisma.companyExpense.findFirst({
      where: { financialRecordId: id },
      select: {
        id: true,
        title: true,
        amount: true,
      },
    });

    // トランザクションで関連レコードを削除
    await prisma.$transaction(async (tx: any) => {
      // 1. CompanyExpenseを削除（存在する場合）
      if (companyExpense) {
        await tx.companyExpense.delete({
          where: { id: companyExpense.id },
        });
      }

      // 2. FinancialRecordを削除
      await tx.financialRecord.delete({
        where: { id },
      });
    });

    logger.info('経費削除成功:', {
      deletedBy: session.user.id,
      financialRecordId: id,
      companyExpenseId: companyExpense?.id,
      title: financialRecord.title,
      amount: financialRecord.amount,
      recordType: financialRecord.recordType,
      approvalStatus: financialRecord.approvalStatus,
    });

    return NextResponse.json({
      success: true,
      message: '経費を削除しました',
      data: {
        id,
        title: financialRecord.title,
        approvalStatus: financialRecord.approvalStatus,
        deletedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    logger.error('経費削除エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: '経費の削除に失敗しました',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}

// 経費更新（PUT メソッド）
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証されていません' }, { status: 401 });
    }

    // 財務管理者権限以上をチェック
    const hasPermission = await checkAdminPermission(session.user.id, 'financial');
    if (!hasPermission) {
      return NextResponse.json({ error: '財務管理者権限が必要です' }, { status: 403 });
    }

    // ユーザー情報取得
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        email: true,
        name: true,
        subscriptionStatus: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }

    const body = await request.json();
    const {
      id,
      title,
      description,
      amount,
      category,
      subCategory,
      expenseType,
      expenseDate,
      isRecurring,
      recurringCycle,
      paymentMethod,
      invoiceNumber,
      receiptUrl,
      attachmentUrls,
      taxIncluded,
      taxRate,
    } = body;

    // 入力検証
    if (!id || !title || !amount || !category || !expenseDate) {
      return NextResponse.json(
        { error: 'ID、タイトル、金額、カテゴリ、発生日は必須です' },
        { status: 400 },
      );
    }

    if (amount <= 0) {
      return NextResponse.json({ error: '金額は0より大きい値を入力してください' }, { status: 400 });
    }

    // 編集対象の経費が存在するかチェック
    const existingExpense = await prisma.financialRecord.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        amount: true,
        approvalStatus: true,
        createdBy: true,
        editHistory: true,
      },
    });

    if (!existingExpense) {
      return NextResponse.json({ error: '編集対象の経費が見つかりません' }, { status: 404 });
    }

    // 承認済みの経費は編集不可
    if (existingExpense.approvalStatus === 'approved') {
      return NextResponse.json({ error: '承認済みの経費は編集できません' }, { status: 400 });
    }

    // 権限チェック（自分が作成した経費のみ編集可能）
    const userIsSuperAdmin = await isSuperAdmin(session.user.id);
    if (!userIsSuperAdmin && existingExpense.createdBy !== session.user.id) {
      return NextResponse.json(
        { error: '他のユーザーが作成した経費は編集できません' },
        { status: 403 },
      );
    }

    // 承認ロジックの再計算
    const APPROVAL_THRESHOLD = 5000;
    let needsApproval = false;
    let finalApprovalStatus = 'approved';
    let recordType = 'company_expense';

    if (userIsSuperAdmin) {
      // スーパー管理者の場合：常に委託者経費として承認不要
      needsApproval = false;
      finalApprovalStatus = 'approved';
      recordType = 'company_expense';
    } else {
      // 財務管理者の場合：受託者経費として処理、5000円以上は承認必要
      needsApproval = amount >= APPROVAL_THRESHOLD;
      finalApprovalStatus = needsApproval ? 'pending' : 'auto_approved';
      recordType = 'contractor_expense';
    }

    const processedTaxRate = taxRate && taxRate !== '' ? parseFloat(taxRate) : null;

    // トランザクションで経費を更新
    const updatedExpense = await prisma.$transaction(async (tx: any) => {
      // 1. FinancialRecordを更新
      const updatedFinancialRecord = await tx.financialRecord.update({
        where: { id },
        data: {
          recordType,
          title,
          description: description || '',
          amount: parseFloat(amount),
          category,
          recordDate: new Date(expenseDate),
          needsApproval: needsApproval,
          approvalStatus: finalApprovalStatus,
          inputBy: session.user.id,
          // 編集履歴を記録
          editHistory: {
            ...((existingExpense.editHistory as any) || {}),
            [`edit_${new Date().toISOString()}`]: {
              editedBy: session.user.id,
              editedAt: new Date().toISOString(),
              previousValues: {
                title: existingExpense.title,
                amount: existingExpense.amount,
              },
              newValues: {
                title,
                amount: parseFloat(amount),
              },
            },
          },
          ...((finalApprovalStatus === 'approved' || finalApprovalStatus === 'auto_approved') && {
            approvedBy: session.user.id,
            approvedAt: new Date(),
          }),
        },
      });

      // 2. 関連するCompanyExpenseも更新
      const companyExpense = await tx.companyExpense.findFirst({
        where: { financialRecordId: id },
      });

      if (companyExpense) {
        await tx.companyExpense.update({
          where: { id: companyExpense.id },
          data: {
            title,
            description: description || '',
            amount: parseFloat(amount),
            category,
            subCategory: subCategory || '',
            expenseDate: new Date(expenseDate),
            expenseType: expenseType || 'operational',
            isRecurring: isRecurring || false,
            recurringCycle: recurringCycle || '',
            requiresApproval: needsApproval,
            approvalStatus: finalApprovalStatus,
            paymentMethod: paymentMethod || '',
            invoiceNumber: invoiceNumber || '',
            receiptUrl: receiptUrl || '',
            attachmentUrls: attachmentUrls ? JSON.stringify(attachmentUrls) : null,
            taxIncluded: taxIncluded !== false,
            taxRate: processedTaxRate,
            ...((finalApprovalStatus === 'approved' || finalApprovalStatus === 'auto_approved') && {
              approvedBy: session.user.id,
              approvedAt: new Date(),
            }),
          },
        });
      }

      return updatedFinancialRecord;
    });

    const userType = userIsSuperAdmin ? '委託者' : '受託者';
    logger.info(`${userType}経費更新成功:`, {
      userId: session.user.id,
      userType,
      expenseId: id,
      amount: parseFloat(amount),
      category,
      needsApproval,
      approvalStatus: finalApprovalStatus,
    });

    let statusMessage;
    if (userIsSuperAdmin) {
      statusMessage = '委託者経費として更新されました（承認不要）';
    } else {
      statusMessage = needsApproval ? '委託者承認待ちとして更新されました' : '自動承認されました';
    }

    return NextResponse.json({
      success: true,
      message: `${userType}経費を更新しました（${statusMessage}）`,
      data: {
        id: updatedExpense.id,
        title,
        amount: parseFloat(amount),
        category,
        approvalStatus: updatedExpense.approvalStatus,
        requiresApproval: needsApproval,
        userType,
      },
    });
  } catch (error: any) {
    logger.error('経費更新エラー:', error);
    return NextResponse.json(
      {
        success: false,
        error: '経費の更新に失敗しました',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 },
    );
  }
}