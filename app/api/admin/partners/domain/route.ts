// app/api/admin/partners/domain/route.ts
// カスタムドメイン登録・検証API（Super Admin用）
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { isSuperAdmin } from '@/lib/auth/constants';

const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID;

/** Vercel APIのベースURL構築 */
function vercelApiUrl(path: string): string {
  const url = new URL(path, 'https://api.vercel.com');
  if (VERCEL_TEAM_ID) {
    url.searchParams.set('teamId', VERCEL_TEAM_ID);
  }
  return url.toString();
}

/** Vercel APIリクエスト共通ヘッダー */
function vercelHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${VERCEL_API_TOKEN}`,
    'Content-Type': 'application/json',
  };
}

/**
 * POST: カスタムドメインを登録
 * Body: { partnerId: string, domain: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email || !isSuperAdmin(session.user.email)) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 });
    }

    const { partnerId, domain } = await request.json();

    if (!partnerId || !domain) {
      return NextResponse.json({ error: 'partnerId と domain は必須です' }, { status: 400 });
    }

    // ドメイン形式のバリデーション
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain)) {
      return NextResponse.json({ error: '無効なドメイン形式です' }, { status: 400 });
    }

    // パートナーの存在確認
    const partner = await prisma.partner.findUnique({ where: { id: partnerId } });
    if (!partner) {
      return NextResponse.json({ error: 'パートナーが見つかりません' }, { status: 404 });
    }

    // ドメインの重複チェック（他パートナーで使用中か）
    const existingDomain = await prisma.partner.findFirst({
      where: { customDomain: domain, id: { not: partnerId } },
    });
    if (existingDomain) {
      return NextResponse.json({ error: 'このドメインは既に他のパートナーで使用されています' }, { status: 409 });
    }

    // Vercel APIでドメインを追加（トークンが設定されている場合のみ）
    let vercelResult = null;
    if (VERCEL_API_TOKEN && VERCEL_PROJECT_ID) {
      const res = await fetch(
        vercelApiUrl(`/v10/projects/${VERCEL_PROJECT_ID}/domains`),
        {
          method: 'POST',
          headers: vercelHeaders(),
          body: JSON.stringify({ name: domain }),
        },
      );

      vercelResult = await res.json();

      if (!res.ok && vercelResult.error?.code !== 'domain_already_exists') {
        console.error('Vercel domain add error:', vercelResult);
        // Vercel APIエラーでもDB上のドメイン設定は続行（手動設定フォールバック）
      }
    }

    // DBにドメインを保存
    await prisma.partner.update({
      where: { id: partnerId },
      data: {
        customDomain: domain,
        domainVerified: false,
      },
    });

    return NextResponse.json({
      success: true,
      domain,
      vercelConfigured: !!(VERCEL_API_TOKEN && VERCEL_PROJECT_ID),
      dnsInstructions: {
        type: 'CNAME',
        name: domain,
        value: 'cname.vercel-dns.com',
        note: 'DNSプロバイダーでCNAMEレコードを追加してください。反映まで最大48時間かかる場合があります。',
      },
    });
  } catch (error) {
    console.error('Domain registration error:', error);
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
  }
}

/**
 * GET: ドメインの検証ステータスを確認
 * Query: ?partnerId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email || !isSuperAdmin(session.user.email)) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 });
    }

    const partnerId = request.nextUrl.searchParams.get('partnerId');
    if (!partnerId) {
      return NextResponse.json({ error: 'partnerId は必須です' }, { status: 400 });
    }

    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
      select: { customDomain: true, domainVerified: true },
    });

    if (!partner || !partner.customDomain) {
      return NextResponse.json({ error: 'ドメインが設定されていません' }, { status: 404 });
    }

    // Vercel APIでDNS検証ステータスを確認
    let dnsConfigured = false;
    let vercelStatus = null;

    if (VERCEL_API_TOKEN) {
      const res = await fetch(
        vercelApiUrl(`/v6/domains/${partner.customDomain}/config`),
        { headers: vercelHeaders() },
      );

      if (res.ok) {
        vercelStatus = await res.json();
        // misconfigured が false なら DNS は正しく設定されている
        dnsConfigured = vercelStatus.misconfigured === false;
      }
    }

    // DNS検証が完了していたらDBを更新
    if (dnsConfigured && !partner.domainVerified) {
      await prisma.partner.update({
        where: { id: partnerId },
        data: { domainVerified: true },
      });
    }

    return NextResponse.json({
      domain: partner.customDomain,
      domainVerified: dnsConfigured || partner.domainVerified,
      dnsConfigured,
      vercelStatus,
    });
  } catch (error) {
    console.error('Domain verification check error:', error);
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
  }
}

/**
 * DELETE: カスタムドメインを削除
 * Body: { partnerId: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email || !isSuperAdmin(session.user.email)) {
      return NextResponse.json({ error: '権限がありません' }, { status: 403 });
    }

    const { partnerId } = await request.json();
    if (!partnerId) {
      return NextResponse.json({ error: 'partnerId は必須です' }, { status: 400 });
    }

    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
      select: { customDomain: true },
    });

    if (!partner?.customDomain) {
      return NextResponse.json({ error: 'ドメインが設定されていません' }, { status: 404 });
    }

    // Vercel APIからドメインを削除
    if (VERCEL_API_TOKEN && VERCEL_PROJECT_ID) {
      await fetch(
        vercelApiUrl(`/v9/projects/${VERCEL_PROJECT_ID}/domains/${partner.customDomain}`),
        {
          method: 'DELETE',
          headers: vercelHeaders(),
        },
      );
    }

    // DBからドメインを削除
    await prisma.partner.update({
      where: { id: partnerId },
      data: {
        customDomain: null,
        domainVerified: false,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Domain deletion error:', error);
    return NextResponse.json({ error: 'サーバーエラー' }, { status: 500 });
  }
}
