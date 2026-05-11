import type {
  NewPlacesSearchResponse,
  NewPlace,
  PrintingCompany,
  Prefecture,
} from './types';

function getApiKey(): string {
  return process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
}

// Places API (New) エンドポイント
const TEXT_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';

const SEARCH_KEYWORDS = ['名刺印刷', '名刺 印刷会社', '印刷会社', '印刷所', 'プリントショップ'];

// リクエスト間のディレイ（ms）
const REQUEST_DELAY = 300;

// Text Search で取得するフィールド（Place Details不要で電話番号・URLも取得可能）
const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.rating',
  'places.userRatingCount',
  'places.businessStatus',
  'places.types',
  'places.nationalPhoneNumber',
  'places.internationalPhoneNumber',
  'places.websiteUri',
  'places.googleMapsUri',
  'nextPageToken',
].join(',');

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Text Search (New) APIで名刺印刷会社を検索 */
async function textSearch(
  query: string,
  pref: Prefecture,
  pageToken?: string
): Promise<NewPlacesSearchResponse> {
  const body: Record<string, unknown> = {
    textQuery: query,
    languageCode: 'ja',
    regionCode: 'JP',
    locationBias: {
      circle: {
        center: { latitude: pref.lat, longitude: pref.lng },
        radius: pref.radius,
      },
    },
    maxResultCount: 20,
  };

  if (pageToken) {
    body.pageToken = pageToken;
  }

  const res = await fetch(TEXT_SEARCH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': getApiKey(),
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Text Search API error: ${res.status} ${res.statusText} - ${errorBody}`);
  }

  return res.json() as Promise<NewPlacesSearchResponse>;
}

/** 1つの都道府県・1つのキーワードで検索（ページネーション対応） */
async function searchForPrefecture(
  keyword: string,
  pref: Prefecture
): Promise<NewPlace[]> {
  const allResults: NewPlace[] = [];
  let pageToken: string | undefined;
  let page = 0;

  do {
    try {
      const response = await textSearch(keyword, pref, pageToken);

      if (response.places) {
        allResults.push(...response.places);
      }

      pageToken = response.nextPageToken;
      page++;
    } catch (e) {
      console.error(
        `  API error for ${pref.name} "${keyword}" (page ${page}): ${(e as Error).message}`
      );
      break;
    }

    await sleep(REQUEST_DELAY);
  } while (pageToken && page < 3); // 最大3ページ（60件）

  return allResults;
}

/** 全都道府県を検索して返す */
export async function collectPrintingCompanies(
  prefectures: Prefecture[],
  options?: { verbose?: boolean }
): Promise<PrintingCompany[]> {
  if (!getApiKey()) {
    throw new Error(
      'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY が設定されていません。.env.local を確認してください。'
    );
  }

  const verbose = options?.verbose ?? true;
  const seenPlaceIds = new Set<string>();
  const companies: PrintingCompany[] = [];

  for (const pref of prefectures) {
    if (verbose) {
      process.stdout.write(`\n[${pref.name}] 検索中...`);
    }

    let prefResults: NewPlace[] = [];

    for (const keyword of SEARCH_KEYWORDS) {
      const results = await searchForPrefecture(keyword, pref);
      prefResults.push(...results);
      await sleep(REQUEST_DELAY);
    }

    // 重複排除（place id）
    const uniqueResults = prefResults.filter((r) => {
      if (seenPlaceIds.has(r.id)) return false;
      seenPlaceIds.add(r.id);
      return true;
    });

    // 営業中のみ（businessStatusがない場合も含める）
    const operationalResults = uniqueResults.filter(
      (r) => !r.businessStatus || r.businessStatus === 'OPERATIONAL'
    );

    if (verbose) {
      process.stdout.write(` ${operationalResults.length}件`);
    }

    // Places API (New) ではText Searchで電話番号・WebサイトURLも取得済み
    for (const result of operationalResults) {
      const prefName = pref.name.replace(/（.*）/, ''); // 「北海道（旭川）」→「北海道」

      companies.push({
        name: result.displayName?.text || '',
        address: result.formattedAddress || '',
        phone: result.nationalPhoneNumber || '',
        website: result.websiteUri || result.googleMapsUri || '',
        rating: result.rating ?? null,
        reviewCount: result.userRatingCount ?? 0,
        prefecture: prefName,
        placeId: result.id,
        businessStatus: result.businessStatus || 'UNKNOWN',
        types: result.types || [],
      });
    }
  }

  if (verbose) {
    console.log(`\n\n合計: ${companies.length}件 収集完了`);
  }

  return companies;
}
