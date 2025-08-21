// lib/address/zipcloud-api.ts

export interface ZipcloudResponse {
  status: number;
  message: string | null;
  results: Array<{
    zipcode: string;
    prefcode: string;
    address1: string; // 都道府県
    address2: string; // 市区町村
    address3: string; // 町域
    kana1: string;
    kana2: string;
    kana3: string;
  }> | null;
}

export interface AddressSearchResult {
  zipcode: string;
  prefecture: string;
  city: string;
  town: string;
  fullAddress: string;
}

/**
 * zipcloud APIを使用して住所を検索する
 */
export async function searchAddressByZipcode(zipcode: string): Promise<AddressSearchResult | null> {
  try {
    // 郵便番号を7桁の数字のみに正規化
    const normalizedZipcode = zipcode.replace(/\D/g, '');

    if (normalizedZipcode.length !== 7) {
      throw new Error('郵便番号は7桁で入力してください');
    }

    const response = await fetch(
      `https://zipcloud.ibsnet.co.jp/api/search?zipcode=${normalizedZipcode}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      throw new Error(`住所検索API エラー: ${response.status}`);
    }

    const data: ZipcloudResponse = await response.json();

    if (data.status !== 200) {
      throw new Error(data.message || '住所検索に失敗しました');
    }

    if (!data.results || data.results.length === 0) {
      return null; // 住所が見つからない
    }

    // 最初の結果を使用
    const result = data.results[0];

    return {
      zipcode: result.zipcode,
      prefecture: result.address1,
      city: result.address2,
      town: result.address3,
      fullAddress: `${result.address1}${result.address2}${result.address3}`,
    };
  } catch (error) {
    console.error('住所検索エラー:', error);
    throw error;
  }
}

/**
 * 複数の郵便番号で一括検索（将来の拡張用）
 */
export async function searchMultipleAddresses(
  zipcodes: string[],
): Promise<(AddressSearchResult | null)[]> {
  const results = await Promise.allSettled(
    zipcodes.map((zipcode) => searchAddressByZipcode(zipcode)),
  );

  return results.map((result) => (result.status === 'fulfilled' ? result.value : null));
}

/**
 * 住所の妥当性をチェック
 */
export function validateAddress(address: string): boolean {
  // 基本的な住所の妥当性チェック
  if (!address || address.trim().length < 5) {
    return false;
  }

  // 都道府県が含まれているかチェック
  const prefectures = [
    '北海道',
    '青森県',
    '岩手県',
    '宮城県',
    '秋田県',
    '山形県',
    '福島県',
    '茨城県',
    '栃木県',
    '群馬県',
    '埼玉県',
    '千葉県',
    '東京都',
    '神奈川県',
    '新潟県',
    '富山県',
    '石川県',
    '福井県',
    '山梨県',
    '長野県',
    '岐阜県',
    '静岡県',
    '愛知県',
    '三重県',
    '滋賀県',
    '京都府',
    '大阪府',
    '兵庫県',
    '奈良県',
    '和歌山県',
    '鳥取県',
    '島根県',
    '岡山県',
    '広島県',
    '山口県',
    '徳島県',
    '香川県',
    '愛媛県',
    '高知県',
    '福岡県',
    '佐賀県',
    '長崎県',
    '熊本県',
    '大分県',
    '宮崎県',
    '鹿児島県',
    '沖縄県',
  ];

  return prefectures.some((prefecture) => address.includes(prefecture));
}