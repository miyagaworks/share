// app/api/vcard/[userId]/route.ts
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { prisma } from '@/lib/prisma';

// 画像データの型を定義
interface ImageData {
  base64: string;
  mimeType: string;
}

// User-Agent解析によるデバイス判定
function detectDevice(request: NextRequest) {
  const ua = request.headers.get('user-agent') || '';
  return {
    isIOS: /iPad|iPhone|iPod/.test(ua),
    isAndroid: /Android/.test(ua),
    isSafari: /Safari/.test(ua) && !/Chrome|CriOS/.test(ua),
    isChrome: /Chrome|CriOS/.test(ua),
    isLineApp: /Line/i.test(ua),
    isInAppBrowser: /Line|Instagram|FB_IAB|FBAN|FBAV|Twitter/i.test(ua),
  };
}

// 画像をfetchしてBase64にエンコードする関数（サイズ最適化付き）
async function fetchImageAsBase64(
  imageUrl: string,
  maxSize: number = 100000,
): Promise<ImageData | null> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      logger.error(`Failed to fetch image: ${response.status}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // サイズチェック（100KB以下に制限）
    if (buffer.length > maxSize) {
      logger.warn('Image too large for vCard embedding');
      return null;
    }

    const base64String = buffer.toString('base64');

    // MIMEタイプの検出（改善版）
    let mimeType = 'image/jpeg';
    const contentType = response.headers.get('content-type');
    if (contentType) {
      mimeType = contentType.split(';')[0];
    } else if (imageUrl.endsWith('.png')) {
      mimeType = 'image/png';
    } else if (imageUrl.endsWith('.gif')) {
      mimeType = 'image/gif';
    } else if (imageUrl.endsWith('.webp')) {
      mimeType = 'image/webp';
    }

    return { base64: base64String, mimeType };
  } catch (error) {
    logger.error('Error fetching image:', error);
    return null;
  }
}

// vCardフィールド値のエスケープ処理（改善版）
function escapeVCardValue(value: string): string {
  if (!value) return '';
  // vCard 3.0仕様に基づくエスケープ
  return value
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

// 電話番号の正規化（日本対応）
function normalizePhoneNumber(phone: string): string {
  let normalized = phone.replace(/[-\s\(\)]/g, '');

  // 国際番号形式でない場合、日本の国番号を追加
  if (!normalized.startsWith('+')) {
    if (normalized.startsWith('0')) {
      normalized = '+81' + normalized.substring(1);
    }
  }

  return normalized;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const resolvedParams = await params;
    const userId = resolvedParams.userId;

    // デバイス検出
    const device = detectDevice(request);

    // ユーザー情報と関連データを一度に取得
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        nameEn: true,
        nameKana: true,
        lastName: true,
        firstName: true,
        lastNameKana: true,
        firstNameKana: true,
        email: true,
        phone: true,
        company: true,
        bio: true,
        image: true,
        position: true,
        departmentId: true,
        snsLinks: {
          select: {
            id: true,
            platform: true,
            username: true,
            url: true,
            displayOrder: true,
          },
          orderBy: { displayOrder: 'asc' },
        },
        customLinks: {
          select: {
            id: true,
            name: true,
            url: true,
            displayOrder: true,
          },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });

    if (!user) {
      logger.error('User not found:', userId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // デバイスに応じた改行コード
    const lineBreak = device.isIOS ? '\r\n' : '\r\n'; // vCard標準はCRLF

    // vCardフォーマットの生成
    const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    // 名前を適切に処理
    let lastName = user.lastName || '',
      firstName = user.firstName || '',
      lastNameKana = user.lastNameKana || '',
      firstNameKana = user.firstNameKana || '';

    // 直接のフィールドがない場合は従来の分割ロジックを使用
    if (!lastName && !firstName && user.name) {
      const nameParts = user.name.split(/[\s　]+/); // 半角・全角スペース対応
      if (nameParts.length > 1) {
        lastName = nameParts[0] || '';
        firstName = nameParts.slice(1).join(' ');
      } else {
        firstName = user.name;
      }
    }

    if (!lastNameKana && !firstNameKana && user.nameKana) {
      const kanaParts = user.nameKana.split(/[\s　]+/);
      if (kanaParts.length > 1) {
        lastNameKana = kanaParts[0] || '';
        firstNameKana = kanaParts.slice(1).join(' ');
      } else {
        firstNameKana = user.nameKana;
      }
    }

    const vcard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${escapeVCardValue(user.name || '')}`,
      `N:${escapeVCardValue(lastName)};${escapeVCardValue(firstName)};;;`,
    ];

    // フリガナ情報（日本語環境向けに複数形式で出力）
    if (firstNameKana || lastNameKana) {
      // iPhone対応
      vcard.push(`X-PHONETIC-FIRST-NAME:${escapeVCardValue(firstNameKana)}`);
      vcard.push(`X-PHONETIC-LAST-NAME:${escapeVCardValue(lastNameKana)}`);

      // Android対応
      vcard.push(`SORT-STRING:${escapeVCardValue(lastNameKana + ' ' + firstNameKana)}`);

      // 古いガラケー対応
      const kanaFullName = `${lastNameKana} ${firstNameKana}`.trim();
      vcard.push(`X-KANA:${escapeVCardValue(kanaFullName)}`);
    }

    vcard.push(`REV:${now}`);

    // 電話番号（複数形式で記載）
    if (user.phone) {
      const normalizedPhone = normalizePhoneNumber(user.phone);
      vcard.push(`TEL;TYPE=CELL:${escapeVCardValue(normalizedPhone)}`);
      vcard.push(`TEL;TYPE=WORK:${escapeVCardValue(user.phone)}`); // 元の形式も保持
    }

    // メールアドレス
    if (user.email) {
      vcard.push(`EMAIL;TYPE=WORK:${escapeVCardValue(user.email)}`);
      vcard.push(`EMAIL;TYPE=INTERNET:${escapeVCardValue(user.email)}`);
    }

    // 会社情報
    if (user.company) {
      vcard.push(`ORG:${escapeVCardValue(user.company)}`);
    }

    // 自己紹介
    if (user.bio) {
      const truncatedBio = user.bio.length > 500 ? user.bio.substring(0, 497) + '...' : user.bio;
      vcard.push(`NOTE:${escapeVCardValue(truncatedBio)}`);
    }

    // 画像処理（デバイスに応じて最適化）
    if (user.image && !device.isInAppBrowser) {
      try {
        // アプリ内ブラウザでは画像埋め込みをスキップ（パフォーマンス対策）
        const imageData = await fetchImageAsBase64(user.image, 50000); // 50KBまでに制限
        if (imageData && imageData.base64) {
          // 短い形式で埋め込み
          const base64Lines = imageData.base64.match(/.{1,74}/g) || [];
          vcard.push(`PHOTO;ENCODING=b;TYPE=${imageData.mimeType.split('/')[1].toUpperCase()}:`);
          base64Lines.forEach((line) => {
            vcard.push(` ${line}`);
          });
        } else {
          // URIで参照
          vcard.push(`PHOTO;VALUE=URI:${user.image}`);
        }
      } catch (error) {
        logger.error('Error processing image:', error);
        vcard.push(`PHOTO;VALUE=URI:${user.image}`);
      }
    }

    // 役職
    if (user.position) {
      vcard.push(`TITLE:${escapeVCardValue(user.position)}`);
    }

    // 部署情報
    if (user.departmentId) {
      const department = await prisma.department.findUnique({
        where: { id: user.departmentId },
        select: { name: true },
      });
      if (department) {
        // ORG-UNITは認識されない場合があるので、ORGに含める
        const orgString = user.company
          ? `${escapeVCardValue(user.company)};${escapeVCardValue(department.name)}`
          : escapeVCardValue(department.name);

        // 既存のORGを置き換え
        const orgIndex = vcard.findIndex((line) => line.startsWith('ORG:'));
        if (orgIndex >= 0) {
          vcard[orgIndex] = `ORG:${orgString}`;
        } else {
          vcard.push(`ORG:${orgString}`);
        }
      }
    }

    // プロフィールURL
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { slug: true },
    });

    if (profile?.slug) {
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.NEXT_PUBLIC_BASE_URL ||
        'https://app.sns-share.com';
      const profileUrl = `${baseUrl}/${profile.slug}`;
      vcard.push(`URL;TYPE=PROFILE:${profileUrl}`);
    }

    // SNSリンク（主要なものだけ含める）
    if (user.snsLinks && user.snsLinks.length > 0) {
      const priorityPlatforms = ['x', 'instagram', 'linkedin', 'facebook'];
      const prioritySnsLinks = user.snsLinks
        .filter((link) => priorityPlatforms.includes(link.platform.toLowerCase()))
        .slice(0, 3); // 最大3つまで

      prioritySnsLinks.forEach((link) => {
        vcard.push(
          `URL;TYPE=${escapeVCardValue(link.platform.toUpperCase())}:${escapeVCardValue(link.url)}`,
        );
      });
    }

    // カスタムリンク（最初の1つだけ）
    if (user.customLinks && user.customLinks.length > 0) {
      const firstLink = user.customLinks[0];
      vcard.push(`URL;TYPE=WORK:${escapeVCardValue(firstLink.url)}`);
    }

    // vCardの終了
    vcard.push('END:VCARD');

    // 標準的なvCardの行区切りはCRLF
    const vcardContent = vcard.join(lineBreak);

    // ファイル名を安全に生成
    const safeName = (user.name || 'contact')
      .replace(/[^a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g, '_')
      .substring(0, 50);
    const safeFilename = `${safeName}.vcf`;

    // レスポンスヘッダーの最適化
    const headers = new Headers({
      'Content-Type': 'text/vcard;charset=utf-8',
      'Content-Disposition': `attachment; filename="${safeFilename}"`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    });

    // iOS Safariの場合、インライン表示を試みる
    if (device.isIOS && device.isSafari) {
      headers.set('Content-Disposition', `inline; filename="${safeFilename}"`);
    }

    return new NextResponse(vcardContent, { headers });
  } catch (error) {
    logger.error('vCard generation error:', error);
    return NextResponse.json({ error: 'Failed to generate vCard' }, { status: 500 });
  }
}