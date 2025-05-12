// scripts/test-cron-fetch.mjs

const CRON_SECRET = 'd5Af5xc/yQI++IcI'; // 実際のシークレット値に置き換え
const API_URL = 'https://app.sns-share.com/api/cron/trial-notification';

async function testCronEndpoint() {
  try {
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${CRON_SECRET}`,
      },
    });

    console.log(`ステータスコード: ${response.status}`);

    if (response.ok) {
      const data = await response.json();
      console.log('レスポンス:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.error(`エラーレスポンス: ${response.statusText}`);
      console.log(await response.text());
    }
  } catch (error) {
    console.error('リクエストエラー:', error.message);
  }
}

testCronEndpoint();