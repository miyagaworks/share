// app/api/address/search/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { searchAddressByZipcode } from '@/lib/address/zipcloud-api';
import { validatePostalCode } from '@/lib/one-tap-seal/qr-slug-manager';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const zipcode = searchParams.get('zipcode');

    if (!zipcode) {
      return NextResponse.json({ error: '郵便番号が指定されていません' }, { status: 400 });
    }

    // 郵便番号の形式チェック
    if (!validatePostalCode(zipcode)) {
      return NextResponse.json({ error: '郵便番号の形式が正しくありません' }, { status: 400 });
    }

    // 住所検索実行
    const result = await searchAddressByZipcode(zipcode);

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error: '該当する住所が見つかりませんでした',
          address: null,
        },
        { status: 404 },
      );
    }

    logger.info('住所検索成功', {
      zipcode,
      prefecture: result.prefecture,
      city: result.city,
    });

    return NextResponse.json({
      success: true,
      address: result,
    });
  } catch (error) {
    logger.error('住所検索API エラー:', error);

    // エラーの種類に応じてレスポンスを調整
    if (error instanceof Error) {
      if (error.message.includes('7桁')) {
        return NextResponse.json({ error: '郵便番号は7桁で入力してください' }, { status: 400 });
      }

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ error: '住所検索に失敗しました' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { zipcodes } = body;

    if (!Array.isArray(zipcodes) || zipcodes.length === 0) {
      return NextResponse.json({ error: '郵便番号の配列が必要です' }, { status: 400 });
    }

    if (zipcodes.length > 10) {
      return NextResponse.json(
        { error: '一度に検索できる郵便番号は10件までです' },
        { status: 400 },
      );
    }

    // 各郵便番号の形式チェック
    const invalidZipcodes = zipcodes.filter((zipcode: string) => !validatePostalCode(zipcode));
    if (invalidZipcodes.length > 0) {
      return NextResponse.json(
        {
          error: '無効な郵便番号が含まれています',
          invalidZipcodes,
        },
        { status: 400 },
      );
    }

    // 複数住所検索実行
    const results = await Promise.allSettled(
      zipcodes.map((zipcode: string) => searchAddressByZipcode(zipcode)),
    );

    const formattedResults = results.map((result, index) => ({
      zipcode: zipcodes[index],
      success: result.status === 'fulfilled' && result.value !== null,
      address: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason?.message : null,
    }));

    logger.info('複数住所検索完了', {
      requestCount: zipcodes.length,
      successCount: formattedResults.filter((r) => r.success).length,
    });

    return NextResponse.json({
      success: true,
      results: formattedResults,
    });
  } catch (error) {
    logger.error('複数住所検索API エラー:', error);
    return NextResponse.json({ error: '住所検索に失敗しました' }, { status: 500 });
  }
}