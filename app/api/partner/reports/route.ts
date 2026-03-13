// app/api/partner/reports/route.ts
// パートナー利用レポートAPI
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { generateMonthlyReport, reportToCSV } from '@/lib/partner/report';

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const partner = await prisma.partner.findUnique({
      where: { adminUserId: session.user.id },
      select: { id: true, createdAt: true },
    });

    if (!partner) {
      return NextResponse.json({ error: 'パートナーが見つかりません' }, { status: 403 });
    }

    const url = new URL(request.url);
    const format = url.searchParams.get('format'); // 'csv' or null
    const monthsParam = url.searchParams.get('months');
    const months = monthsParam ? Math.min(parseInt(monthsParam, 10), 12) : 6;

    // 過去N ヶ月分のレポートを生成
    const now = new Date();
    const reports = [];

    for (let i = 0; i < months; i++) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const report = await generateMonthlyReport(
        partner.id,
        targetDate.getFullYear(),
        targetDate.getMonth() + 1,
      );
      reports.push(report);
    }

    // CSV形式で返す場合
    if (format === 'csv') {
      const csv = reportToCSV(reports);
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="partner-report-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}.csv"`,
        },
      });
    }

    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Partner reports API error:', error);
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
  }
}
