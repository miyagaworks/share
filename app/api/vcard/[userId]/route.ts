// app/api/vcard/[userId]/route.ts
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/utils/logger";
import { prisma } from '@/lib/prisma';
// 画像データの型を定義
interface ImageData {
  base64: string;
  mimeType: string;
}
// 画像をfetchしてBase64にエンコードする関数
async function fetchImageAsBase64(imageUrl: string): Promise<ImageData | null> {
  try {
    // 外部URLからの画像を取得
    const response = await fetch(imageUrl);
    if (!response.ok) {
      logger.error(`Failed to fetch image: ${response.status}`);
      return null;
    }
    // ArrayBufferとしてバイナリを取得
    const arrayBuffer = await response.arrayBuffer();
    // Base64に変換
    const base64String = Buffer.from(arrayBuffer).toString('base64');
    // MIMEタイプの検出（簡易版）
    let mimeType = 'image/jpeg'; // デフォルト値
    if (imageUrl.endsWith('.png')) mimeType = 'image/png';
    if (imageUrl.endsWith('.gif')) mimeType = 'image/gif';
    if (imageUrl.endsWith('.webp')) mimeType = 'image/webp';
    return { base64: base64String, mimeType };
  } catch (error) {
    logger.error('Error fetching image:', error);
    return null;
  }
}
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
    // selectを使って必要なフィールドを明示的に指定
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        nameEn: true,
        nameKana: true,
        // 新しいフィールドを追加
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
    // vCardフォーマットの生成
    const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    // 名前を適切に処理
    let lastName = user.lastName || '',
      firstName = user.firstName || '',
      lastNameKana = user.lastNameKana || '',
      firstNameKana = user.firstNameKana || '';
    // 直接のフィールドがない場合は従来の分割ロジックを使用
    if (!lastName && !firstName && user.name) {
      const nameParts = user.name.split(' ');
      if (nameParts.length > 1) {
        lastName = nameParts[0] || '';
        firstName = nameParts.slice(1).join(' ');
      } else {
        firstName = user.name;
      }
    }
    if (!lastNameKana && !firstNameKana && user.nameKana) {
      const kanaParts = user.nameKana.split(' ');
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
    // フリガナ情報があれば追加
    if (firstNameKana || lastNameKana) {
      // iPhoneのフリガナ対応
      vcard.push(`X-PHONETIC-FIRST-NAME:${escapeVCardValue(firstNameKana)}`);
      vcard.push(`X-PHONETIC-LAST-NAME:${escapeVCardValue(lastNameKana)}`);
      // Androidも含めた幅広い対応のために追加
      vcard.push(`X-KANA:${escapeVCardValue(firstNameKana + ' ' + lastNameKana)}`);
      // 日本の携帯電話向け
      vcard.push(
        `SOUND;X-IRMC-N;CHARSET=UTF-8;ENCODING=QUOTED-PRINTABLE:;${escapeVCardValue(firstNameKana)};${escapeVCardValue(lastNameKana)};;`,
      );
    }
    vcard.push(`REV:${now}`);
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
      try {
        // 画像をBase64で取得
        const imageData = await fetchImageAsBase64(user.image);
        if (imageData && imageData.base64) {
          // 画像データをvCardに埋め込む（iPhone対応形式）
          vcard.push(`PHOTO;ENCODING=b;TYPE=${imageData.mimeType}:${imageData.base64}`);
        } else {
          // 取得に失敗した場合はURIで参照（フォールバック）
          vcard.push(`PHOTO;VALUE=URI:${user.image}`);
        }
      } catch (error) {
        logger.error('Error processing image:', error);
        // エラーが発生した場合もURIで参照を試みる
        vcard.push(`PHOTO;VALUE=URI:${user.image}`);
      }
    }
    // 役職があれば追加
    if (user.position) {
      vcard.push(`TITLE:${escapeVCardValue(user.position)}`);
    }
    // 部署情報を追加
    if (user.departmentId) {
      const department = await prisma.department.findUnique({
        where: { id: user.departmentId },
      });
      if (department) {
        vcard.push(`ORG-UNIT:${escapeVCardValue(department.name)}`);
      }
    }
    // プロフィールURLを追加
    const profile = await prisma.profile.findUnique({
      where: { userId },
    });
    if (profile?.slug) {
      const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.NEXT_PUBLIC_BASE_URL ||
        process.env.NEXTAUTH_URL ||
        'https://app.sns-share.com';
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
    logger.error('vCard generation error:', error);
    return NextResponse.json({ error: 'Failed to generate vCard' }, { status: 500 });
  }
}