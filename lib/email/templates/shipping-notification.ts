// lib/email/templates/shipping-notification.ts
import { getBrandConfig } from '@/lib/brand/config';
import { ONE_TAP_SEAL_COLOR_NAMES, type OneTapSealColor } from '@/types/one-tap-seal';

interface ShippingNotificationParams {
  customerName: string;
  customerEmail: string;
  orderId: string;
  trackingNumber: string;
  items: {
    color: OneTapSealColor;
    quantity: number;
    profileSlug: string;
  }[];
  shippingAddress: {
    postalCode: string;
    address: string;
    building?: string;
    recipientName: string;
  };
  orderDate: string;
  totalAmount: number;
}

export function getShippingNotificationTemplate(params: ShippingNotificationParams) {
  const brand = getBrandConfig();
  const { customerName, orderId, trackingNumber, items, shippingAddress, orderDate, totalAmount } =
    params;

  // アイテム一覧を文字列として構築
  const itemsList = items
    .map(
      (item) =>
        `　${ONE_TAP_SEAL_COLOR_NAMES[item.color]} × ${item.quantity}個 (URL: ${brand.appUrl.replace(/^https?:\/\//, '')}/${item.profileSlug})`,
    )
    .join('\n');

  // 配送先住所を構築
  const fullAddress = shippingAddress.building
    ? `${shippingAddress.address} ${shippingAddress.building}`
    : shippingAddress.address;

  const subject = `【${brand.name}】ワンタップシール発送完了のお知らせ`;

  const text = `${customerName} 様

いつも${brand.name}をご利用いただき、誠にありがとうございます。
この度は、ワンタップシールをご注文いただき、誠にありがとうございます。

ご注文の商品を発送いたしましたのでお知らせいたします。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 発送情報
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
注文番号    : ${orderId}
注文日      : ${orderDate}
発送日      : ${new Date().toLocaleDateString('ja-JP')}
追跡番号    : ${trackingNumber}
配送方法    : クリックポスト（日本郵便）

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 商品内容
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${itemsList}

合計金額    : ¥${totalAmount.toLocaleString()}（税込・送料込）

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 配送先
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${shippingAddress.recipientName} 様
〒${shippingAddress.postalCode}
${fullAddress}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 配送状況の確認
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
下記のURLから配送状況をご確認いただけます：
https://trackings.post.japanpost.jp/services/srv/search/direct?reqCodeNo1=${trackingNumber}

※ 発送から追跡情報が反映されるまで数時間かかる場合があります

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 商品到着後について
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. ワンタップシールにNFCタグが内蔵されています
2. スマートフォンをシールにかざすと、設定されたURLにアクセスされます
3. 各色のシールには、上記の商品内容に記載されたURLが設定されています

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ ご不明点・お困りの点がございましたら
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
サポートまでお気軽にお問い合わせください。

📧 Email : ${brand.supportEmail}
🌐 Web   : ${brand.appUrl}

商品到着まで今しばらくお待ちください。
今後とも${brand.name}をよろしくお願いいたします。

─────────────────────────────────────────────────────
${brand.name} サポートチーム
✉️ ${brand.supportEmail}
🌐 ${brand.appUrl}
─────────────────────────────────────────────────────`;

  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      font-family: 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic Medium', 'Meiryo', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      background-color: #f8f9fa;
      padding: 20px;
    }
    .email-container {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: bold;
    }
    .content {
      padding: 30px 20px;
    }
    .section {
      margin-bottom: 30px;
      padding: 20px;
      border-radius: 8px;
      background-color: #f8f9fa;
      border-left: 4px solid #667eea;
    }
    .section h2 {
      margin: 0 0 15px 0;
      font-size: 18px;
      color: #667eea;
      font-weight: bold;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    .info-table td {
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }
    .info-table td:first-child {
      font-weight: bold;
      color: #555;
      width: 120px;
    }
    .items-list {
      background-color: white;
      border: 1px solid #ddd;
      border-radius: 6px;
      padding: 15px;
    }
    .item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid #eee;
    }
    .item:last-child {
      border-bottom: none;
    }
    .color-indicator {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: inline-block;
      margin-right: 10px;
      border: 2px solid #ddd;
    }
    .color-black { background-color: #000; }
    .color-gray { background-color: #6b7280; }
    .color-white { background-color: #fff; }
    .tracking-button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: bold;
      margin: 15px 0;
      text-align: center;
    }
    .tracking-button:hover {
      opacity: 0.9;
    }
    .footer {
      background-color: #f1f3f4;
      padding: 20px;
      text-align: center;
      color: #666;
      font-size: 14px;
    }
    .highlight {
      background-color: #e3f2fd;
      padding: 15px;
      border-radius: 6px;
      margin: 15px 0;
      border: 1px solid #bbdefb;
    }
    @media (max-width: 600px) {
      body { padding: 10px; }
      .content { padding: 20px 15px; }
      .section { padding: 15px; }
      .info-table td:first-child { width: 100px; }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>📦 ワンタップシール発送完了</h1>
      <p style="margin: 10px 0 0 0;">ご注文商品を発送いたしました</p>
    </div>
    
    <div class="content">
      <p>こんにちは、<strong>${customerName}</strong> 様</p>
      <p>いつも${brand.name}をご利用いただき、誠にありがとうございます。<br>
      この度は、ワンタップシールをご注文いただき、誠にありがとうございます。</p>
      
      <p><strong>ご注文の商品を発送いたしました</strong>ので、お知らせいたします。</p>

      <div class="section">
        <h2>📋 発送情報</h2>
        <table class="info-table">
          <tr>
            <td>注文番号</td>
            <td>${orderId}</td>
          </tr>
          <tr>
            <td>注文日</td>
            <td>${orderDate}</td>
          </tr>
          <tr>
            <td>発送日</td>
            <td>${new Date().toLocaleDateString('ja-JP')}</td>
          </tr>
          <tr>
            <td>追跡番号</td>
            <td><strong style="color: #667eea;">${trackingNumber}</strong></td>
          </tr>
          <tr>
            <td>配送方法</td>
            <td>クリックポスト（日本郵便）</td>
          </tr>
        </table>
        
        <div class="highlight">
          <strong>📍 配送状況の確認</strong><br>
          <a href="https://trackings.post.japanpost.jp/services/srv/search/direct?reqCodeNo1=${trackingNumber}" class="tracking-button">
            配送状況を確認する
          </a>
          <br>
          <small>※発送から追跡情報が反映されるまで数時間かかる場合があります</small>
        </div>
      </div>

      <div class="section">
        <h2>📦 商品内容</h2>
        <div class="items-list">
          ${items
            .map(
              (item) => `
          <div class="item">
            <div style="display: flex; align-items: center;">
              <span class="color-indicator color-${item.color}"></span>
              <span><strong>${ONE_TAP_SEAL_COLOR_NAMES[item.color]}</strong> × ${item.quantity}個</span>
            </div>
            <div style="font-size: 12px; color: #666;">
              URL: ${brand.appUrl.replace(/^https?:\/\//, '')}/${item.profileSlug}
            </div>
          </div>
          `,
            )
            .join('')}
          
          <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #667eea; text-align: right;">
            <strong style="font-size: 18px; color: #667eea;">合計金額: ¥${totalAmount.toLocaleString()}</strong>
            <div style="font-size: 12px; color: #666;">(税込・送料込)</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>📍 配送先</h2>
        <table class="info-table">
          <tr>
            <td>お名前</td>
            <td>${shippingAddress.recipientName} 様</td>
          </tr>
          <tr>
            <td>郵便番号</td>
            <td>〒${shippingAddress.postalCode}</td>
          </tr>
          <tr>
            <td>住所</td>
            <td>${fullAddress}</td>
          </tr>
        </table>
      </div>

      <div class="section">
        <h2>💡 商品到着後について</h2>
        <div style="background-color: white; padding: 15px; border-radius: 6px;">
          <ol style="margin: 0; padding-left: 20px; line-height: 1.8;">
            <li><strong>ワンタップシールにNFCタグが内蔵されています</strong></li>
            <li><strong>スマートフォンをシールにかざす</strong>と、設定されたURLにアクセスされます</li>
            <li><strong>各色のシールには、上記の商品内容に記載されたURLが設定されています</strong></li>
          </ol>
        </div>
      </div>

      <div class="highlight">
        <h3 style="margin: 0 0 10px 0;">❓ ご不明点がございましたら</h3>
        <p style="margin: 0;">サポートまでお気軽にお問い合わせください。</p>
        <p style="margin: 5px 0 0 0; font-size: 14px;">
          📧 <a href="mailto:${brand.supportEmail}" style="color: #667eea;">${brand.supportEmail}</a> |
          🌐 <a href="${brand.appUrl}" style="color: #667eea;">${brand.appUrl.replace(/^https?:\/\//, '')}</a>
        </p>
      </div>

      <p style="margin-top: 30px;">商品到着まで今しばらくお待ちください。<br>
      今後とも${brand.name}をよろしくお願いいたします。</p>
    </div>

    <div class="footer">
      <strong>${brand.name} サポートチーム</strong><br>
      📧 ${brand.supportEmail}<br>
      🌐 ${brand.appUrl}
    </div>
  </div>
</body>
</html>`;

  return {
    subject,
    text,
    html,
  };
}