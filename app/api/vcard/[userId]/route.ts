// app/api/vcard/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// vCardフィールド値のエスケープ処理
function escapeVCardValue(value: string): string {
  if (!value) return '';
  // vCardの仕様に基づき、コンマ、セミコロン、バックスラッシュをエスケープ
  return value
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, '\\n');
}

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const userId = params.userId;

    // ユーザー情報と関連データを一度に取得
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        snsLinks: {
          orderBy: { displayOrder: 'asc' },
        },
        customLinks: {
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    if (!user) {
      console.error('User not found:', userId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // vCardフォーマットの生成
    const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    // 名前を適切に処理
    let lastName = '',
      firstName = '';
    if (user.nameEn) {
      const nameParts = user.nameEn.split(' ');
      if (nameParts.length > 1) {
        lastName = nameParts.pop() || '';
        firstName = nameParts.join(' ');
      } else {
        firstName = user.nameEn;
      }
    } else if (user.name) {
      // nameEnがない場合はnameを使用
      firstName = user.name;
    }

    const vcard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${escapeVCardValue(user.name || '')}`,
      `N:${escapeVCardValue(lastName)};${escapeVCardValue(firstName)};;;`,
      `REV:${now}`,
    ];

    // オプション情報の追加
    if (user.phone) {
      vcard.push(`TEL;TYPE=CELL:${escapeVCardValue(user.phone)}`);
    }

    if (user.email) {
      vcard.push(`EMAIL;TYPE=INTERNET:${escapeVCardValue(user.email)}`);
    }

    if (user.company) {
      vcard.push(`ORG:${escapeVCardValue(user.company)}`);
    }

    if (user.bio) {
      vcard.push(`NOTE:${escapeVCardValue(user.bio)}`);
    }

    if (user.image) {
      // 画像URLを含める
      vcard.push(`PHOTO;VALUE=URI:${user.image}`);
    }

    // プロフィールURLを追加
    const profile = await prisma.profile.findUnique({
      where: { userId },
    });

    if (profile?.slug) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const profileUrl = `${baseUrl}/${profile.slug}`;
      vcard.push(`URL;TYPE=PROFILE:${profileUrl}`);
    }

    // SNSリンクの追加
    if (user.snsLinks && user.snsLinks.length > 0) {
      user.snsLinks.forEach((link) => {
        vcard.push(
          `URL;TYPE=${escapeVCardValue(link.platform.toUpperCase())}:${escapeVCardValue(link.url)}`,
        );
      });
    }

    // カスタムリンクの追加
    if (user.customLinks && user.customLinks.length > 0) {
      user.customLinks.forEach((link) => {
        const linkLabel = escapeVCardValue(link.name || 'WORK');
        vcard.push(`URL;TYPE=${linkLabel}:${escapeVCardValue(link.url)}`);
      });
    }

    // vCardの終了
    vcard.push('END:VCARD');

    // 標準的なvCardの行区切りはCRLF
    const vcardContent = vcard.join('\r\n');

    // ファイル名をASCII文字のみにする
    const safeFilename = 'contact.vcf';

    // vCardデータを返す
    // Content-Dispositionヘッダーに非ASCII文字を含めないようにする
    return new NextResponse(vcardContent, {
      headers: {
        'Content-Type': 'text/vcard',
        'Content-Disposition': `attachment; filename="${safeFilename}"`,
      },
    });
  } catch (error) {
    console.error('vCard generation error:', error);
    return NextResponse.json({ error: 'Failed to generate vCard' }, { status: 500 });
  }
}