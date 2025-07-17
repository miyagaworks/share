// app/api/support/contact/route.ts
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { logger } from "@/lib/utils/logger";
import { auth } from '@/auth';
import { Resend } from 'resend';
// Resendインスタンスを初期化
const resend = new Resend(process.env.RESEND_API_KEY);
// お問い合わせのカテゴリを日本語に変換する関数
function getContactTypeJapanese(type: string): string {
  const types: Record<string, string> = {
    account: 'アカウントについて',
    billing: 'お支払いについて',
    technical: '技術的な問題',
    feature: '機能に関する質問',
    feedback: 'フィードバック',
    corporate: '法人プランについて',
    other: 'その他',
  };
  return types[type] || 'その他';
}
export async function POST(req: Request) {
  const headers = {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0',
  };
  try {
    // 認証情報を取得するが、セッションを作成しない
    const session = await auth();
    const userId = session?.user?.id; // ユーザーIDだけを抽出
    const { name, email, companyName, contactType, subject, message } = await req.json();
    // バリデーション
    if (!name || !email || !subject || !message) {
      return NextResponse.json({ message: 'すべての必須項目を入力してください' }, { status: 400 });
    }
    // 法人プランの場合は会社名必須
    if (contactType === 'corporate' && !companyName) {
      return NextResponse.json(
        { message: '法人プランのお問い合わせには会社名が必須です' },
        { status: 400 },
      );
    }
    // お問い合わせ情報をコンソールに記録
    logger.debug('お問い合わせ内容:', {
      name,
      email,
      companyName: companyName || null,
      type: contactType,
      subject,
      message: message.substring(0, 100) + '...',
      userId: userId || null, // 変数から取得
    });
    const contactTypeJapanese = getContactTypeJapanese(contactType);
    // サイト名を追加（スパムフィルター対策）
    const siteName = 'Share';
    // 法人プランのお問い合わせの場合
    if (contactType === 'corporate') {
      // 管理者向けメール本文（HTML形式）
      const adminHtmlContent = `
<div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #1E40AF; margin-bottom: 20px;">法人プランのお問い合わせがありました</h2>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
    <tr>
      <th style="text-align: left; padding: 8px; background-color: #f8fafc; border: 1px solid #e2e8f0; width: 30%;">会社名</th>
      <td style="padding: 8px; border: 1px solid #e2e8f0;">${companyName}</td>
    </tr>
    <tr>
      <th style="text-align: left; padding: 8px; background-color: #f8fafc; border: 1px solid #e2e8f0;">担当者名</th>
      <td style="padding: 8px; border: 1px solid #e2e8f0;">${name}</td>
    </tr>
    <tr>
      <th style="text-align: left; padding: 8px; background-color: #f8fafc; border: 1px solid #e2e8f0;">メールアドレス</th>
      <td style="padding: 8px; border: 1px solid #e2e8f0;"><a href="mailto:${email}">${email}</a></td>
    </tr>
    <tr>
      <th style="text-align: left; padding: 8px; background-color: #f8fafc; border: 1px solid #e2e8f0;">件名</th>
      <td style="padding: 8px; border: 1px solid #e2e8f0;">${subject}</td>
    </tr>
    ${
      userId
        ? `
    <tr>
      <th style="text-align: left; padding: 8px; background-color: #f8fafc; border: 1px solid #e2e8f0;">ユーザーID</th>
      <td style="padding: 8px; border: 1px solid #e2e8f0;">${userId}</td>
    </tr>
    `
        : ''
    }
  </table>
  <div style="margin-bottom: 20px;">
    <h3 style="color: #1E40AF; margin-bottom: 10px;">お問い合わせ内容:</h3>
    <div style="background-color: #f8fafc; padding: 15px; border-radius: 4px; border: 1px solid #e2e8f0; white-space: pre-line; text-align: justify;">${message}</div>
  </div>
  <div style="background-color: #fef2f2; padding: 12px; border-radius: 4px; border-left: 4px solid #ef4444;">
    <p style="margin: 0; color: #b91c1c; font-weight: 500;">※このお問い合わせは優先対応が必要です。1営業日以内に返信してください。</p>
  </div>
  <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 550px; color: #333; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
    <div style="font-size: 16px; font-weight: bold; margin: 0; color: #1E40AF;">Share サポートチーム</div>
    <div style="font-size: 14px; margin: 2px 0 8px; color: #4B5563;">株式会社Senrigan Share運営事務局</div>
    <div style="border-top: 2px solid #3B82F6; margin: 12px 0; width: 100px;"></div>
    <div style="font-size: 13px; margin: 4px 0;">
      メール: <a href="mailto:support@sns-share.com" style="color: #3B82F6; text-decoration: none;">support@sns-share.com</a><br>
      電話: 082-209-0181（平日10:00〜18:00 土日祝日休業）<br>
      ウェブ: <a href="https://app.sns-share.com" style="color: #3B82F6; text-decoration: none;">app.sns-share.com</a>
    </div>
    <div style="margin: 12px 0; font-style: italic; color: #4B5563; font-size: 13px; border-left: 3px solid #3B82F6; padding-left: 10px;">
      すべてのSNS、ワンタップでShare
    </div>
    <div style="font-size: 12px; color: #6B7280; margin-top: 8px;">
      〒731-0137 広島県広島市安佐南区山本2-3-35<br>
      運営: <a href="https://senrigan.systems" style="color: #3B82F6; text-decoration: none; font-weight: 500;" target="_blank">株式会社Senrigan</a>
    </div>
    <div style="margin-top: 10px;">
      <a href="https://app.sns-share.com/legal/privacy" style="display: inline-block; margin-right: 8px; color: #3B82F6; text-decoration: none;">プライバシーポリシー</a> | 
      <a href="https://app.sns-share.com/legal/terms" style="display: inline-block; margin-right: 8px; color: #3B82F6; text-decoration: none;">利用規約</a>
    </div>
  </div>
</div>
      `;
      // 自動返信用のメール本文（HTML形式）
      const autoReplyHtmlContent = `
<div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <p style="font-size: 16px; margin-bottom: 20px;">${name} 様</p>
  <p style="margin-bottom: 20px;">
    法人プランへのお問い合わせありがとうございます。<br>
    以下の内容でお問い合わせを受け付けました。担当者より1営業日以内にご連絡いたします。
  </p>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
    <tr>
      <th style="text-align: left; padding: 8px; background-color: #f8fafc; border: 1px solid #e2e8f0; width: 30%;">会社名</th>
      <td style="padding: 8px; border: 1px solid #e2e8f0;">${companyName}</td>
    </tr>
    <tr>
      <th style="text-align: left; padding: 8px; background-color: #f8fafc; border: 1px solid #e2e8f0;">お問い合わせカテゴリ</th>
      <td style="padding: 8px; border: 1px solid #e2e8f0;">${contactTypeJapanese}</td>
    </tr>
    <tr>
      <th style="text-align: left; padding: 8px; background-color: #f8fafc; border: 1px solid #e2e8f0;">件名</th>
      <td style="padding: 8px; border: 1px solid #e2e8f0;">${subject}</td>
    </tr>
  </table>
  <div style="margin-bottom: 20px;">
    <h3 style="color: #1E40AF; margin-bottom: 10px;">お問い合わせ内容:</h3>
    <div style="background-color: #f8fafc; padding: 15px; border-radius: 4px; border: 1px solid #e2e8f0; white-space: pre-line; text-align: justify;">${message}</div>
  </div>
  <p style="color: #6B7280; font-size: 13px; margin-top: 30px; padding-top: 10px; border-top: 1px solid #e2e8f0;">
    ※このメールは自動送信されています。このメールには返信しないでください。
  </p>
  <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 550px; color: #333; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
    <div style="font-size: 16px; font-weight: bold; margin: 0; color: #1E40AF;">Share サポートチーム</div>
    <div style="font-size: 14px; margin: 2px 0 8px; color: #4B5563;">株式会社Senrigan Share運営事務局</div>
    <div style="border-top: 2px solid #3B82F6; margin: 12px 0; width: 100px;"></div>
    <div style="font-size: 13px; margin: 4px 0;">
      メール: <a href="mailto:support@sns-share.com" style="color: #3B82F6; text-decoration: none;">support@sns-share.com</a><br>
      電話: 082-209-0181（平日10:00〜18:00 土日祝日休業）<br>
      ウェブ: <a href="https://app.sns-share.com" style="color: #3B82F6; text-decoration: none;">app.sns-share.com</a>
    </div>
    <div style="margin: 12px 0; font-style: italic; color: #4B5563; font-size: 13px; border-left: 3px solid #3B82F6; padding-left: 10px;">
      すべてのSNS、ワンタップでShare
    </div>
    <div style="font-size: 12px; color: #6B7280; margin-top: 8px;">
      〒731-0137 広島県広島市安佐南区山本2-3-35<br>
      運営: <a href="https://senrigan.systems" style="color: #3B82F6; text-decoration: none; font-weight: 500;" target="_blank">株式会社Senrigan</a>
    </div>
    <div style="margin-top: 10px;">
      <a href="https://app.sns-share.com/legal/privacy" style="display: inline-block; margin-right: 8px; color: #3B82F6; text-decoration: none;">プライバシーポリシー</a> | 
      <a href="https://app.sns-share.com/legal/terms" style="display: inline-block; margin-right: 8px; color: #3B82F6; text-decoration: none;">利用規約</a>
    </div>
  </div>
</div>
      `;
      try {
        // 管理者へのメール送信
        const { error: adminEmailError } = await resend.emails.send({
          from: `${siteName} <noreply@sns-share.com>`,
          to: [process.env.ADMIN_EMAIL || 'corporate@sns-share.com'],
          subject: `【重要】法人プランのお問い合わせ: ${subject}`,
          html: adminHtmlContent,
        });
        if (adminEmailError) {
          logger.error('管理者へのメール送信エラー:', adminEmailError);
          return NextResponse.json(
            { message: 'メール送信に失敗しました', error: adminEmailError.message },
            { status: 500, headers },
          );
        }
        // ユーザーへの自動返信メール送信
        const { error: userEmailError } = await resend.emails.send({
          from: `${siteName} <noreply@sns-share.com>`,
          to: [email],
          subject: `【${siteName}】法人プランへのお問い合わせを受け付けました`,
          html: autoReplyHtmlContent,
        });
        if (userEmailError) {
          logger.error('ユーザーへのメール送信エラー:', userEmailError);
          // 管理者へのメールは送信できたので、ユーザーへのメール送信失敗のみログに残す
          logger.error('ユーザーへのメール送信に失敗しました:', userEmailError);
        }
      } catch (emailError) {
        logger.error('メール送信に失敗しました:', emailError);
        return NextResponse.json(
          {
            message: 'メール送信に失敗しました',
            error: emailError instanceof Error ? emailError.message : String(emailError),
          },
          { status: 500, headers },
        );
      }
    } else {
      // 通常のお問い合わせ処理
      // 管理者向けメール本文（HTML形式）
      const adminHtmlContent = `
<div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #1E40AF; margin-bottom: 20px;">新しいお問い合わせが届きました</h2>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
    <tr>
      <th style="text-align: left; padding: 8px; background-color: #f8fafc; border: 1px solid #e2e8f0; width: 30%;">お名前</th>
      <td style="padding: 8px; border: 1px solid #e2e8f0;">${name}</td>
    </tr>
    <tr>
      <th style="text-align: left; padding: 8px; background-color: #f8fafc; border: 1px solid #e2e8f0;">メールアドレス</th>
      <td style="padding: 8px; border: 1px solid #e2e8f0;"><a href="mailto:${email}">${email}</a></td>
    </tr>
    ${
      companyName
        ? `
    <tr>
      <th style="text-align: left; padding: 8px; background-color: #f8fafc; border: 1px solid #e2e8f0;">会社名</th>
      <td style="padding: 8px; border: 1px solid #e2e8f0;">${companyName}</td>
    </tr>
    `
        : ''
    }
    <tr>
      <th style="text-align: left; padding: 8px; background-color: #f8fafc; border: 1px solid #e2e8f0;">お問い合わせカテゴリ</th>
      <td style="padding: 8px; border: 1px solid #e2e8f0;">${contactTypeJapanese}</td>
    </tr>
    <tr>
      <th style="text-align: left; padding: 8px; background-color: #f8fafc; border: 1px solid #e2e8f0;">件名</th>
      <td style="padding: 8px; border: 1px solid #e2e8f0;">${subject}</td>
    </tr>
    ${
      userId
        ? `
    <tr>
      <th style="text-align: left; padding: 8px; background-color: #f8fafc; border: 1px solid #e2e8f0;">ユーザーID</th>
      <td style="padding: 8px; border: 1px solid #e2e8f0;">${userId}</td>
    </tr>
    `
        : ''
    }
  </table>
  <div style="margin-bottom: 20px;">
    <h3 style="color: #1E40AF; margin-bottom: 10px;">お問い合わせ内容:</h3>
    <div style="background-color: #f8fafc; padding: 15px; border-radius: 4px; border: 1px solid #e2e8f0; white-space: pre-line; text-align: justify;">${message}</div>
  </div>
  <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 550px; color: #333; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
    <div style="font-size: 16px; font-weight: bold; margin: 0; color: #1E40AF;">Share サポートチーム</div>
    <div style="font-size: 14px; margin: 2px 0 8px; color: #4B5563;">株式会社Senrigan Share運営事務局</div>
    <div style="border-top: 2px solid #3B82F6; margin: 12px 0; width: 100px;"></div>
    <div style="font-size: 13px; margin: 4px 0;">
      メール: <a href="mailto:support@sns-share.com" style="color: #3B82F6; text-decoration: none;">support@sns-share.com</a><br>
      電話: 082-209-0181（平日10:00〜18:00 土日祝日休業）<br>
      ウェブ: <a href="https://app.sns-share.com" style="color: #3B82F6; text-decoration: none;">app.sns-share.com</a>
    </div>
    <div style="margin: 12px 0; font-style: italic; color: #4B5563; font-size: 13px; border-left: 3px solid #3B82F6; padding-left: 10px;">
      すべてのSNS、ワンタップでShare
    </div>
    <div style="font-size: 12px; color: #6B7280; margin-top: 8px;">
      〒731-0137 広島県広島市安佐南区山本2-3-35<br>
      運営: <a href="https://senrigan.systems" style="color: #3B82F6; text-decoration: none; font-weight: 500;" target="_blank">株式会社Senrigan</a>
    </div>
    <div style="margin-top: 10px;">
      <a href="https://app.sns-share.com/legal/privacy" style="display: inline-block; margin-right: 8px; color: #3B82F6; text-decoration: none;">プライバシーポリシー</a> | 
      <a href="https://app.sns-share.com/legal/terms" style="display: inline-block; margin-right: 8px; color: #3B82F6; text-decoration: none;">利用規約</a>
    </div>
  </div>
</div>
      `;
      // 自動返信用のメール本文（HTML形式）
      const autoReplyHtmlContent = `
<div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <p style="font-size: 16px; margin-bottom: 20px;">${name} 様</p>
  <p style="margin-bottom: 20px;">
    お問い合わせありがとうございます。<br>
    以下の内容でお問い合わせを受け付けました。内容を確認の上、必要に応じてご連絡いたします。
  </p>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
    <tr>
      <th style="text-align: left; padding: 8px; background-color: #f8fafc; border: 1px solid #e2e8f0; width: 30%;">お問い合わせカテゴリ</th>
      <td style="padding: 8px; border: 1px solid #e2e8f0;">${contactTypeJapanese}</td>
    </tr>
    <tr>
      <th style="text-align: left; padding: 8px; background-color: #f8fafc; border: 1px solid #e2e8f0;">件名</th>
      <td style="padding: 8px; border: 1px solid #e2e8f0;">${subject}</td>
    </tr>
  </table>
  <div style="margin-bottom: 20px;">
    <h3 style="color: #1E40AF; margin-bottom: 10px;">お問い合わせ内容:</h3>
    <div style="background-color: #f8fafc; padding: 15px; border-radius: 4px; border: 1px solid #e2e8f0; white-space: pre-line; text-align: justify;">${message}</div>
  </div>
  <p style="color: #6B7280; font-size: 13px; margin-top: 30px; padding-top: 10px; border-top: 1px solid #e2e8f0;">
    ※このメールは自動送信されています。このメールには返信しないでください。
  </p>
  <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 550px; color: #333; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
    <div style="font-size: 16px; font-weight: bold; margin: 0; color: #1E40AF;">Share サポートチーム</div>
    <div style="font-size: 14px; margin: 2px 0 8px; color: #4B5563;">株式会社Senrigan Share運営事務局</div>
    <div style="border-top: 2px solid #3B82F6; margin: 12px 0; width: 100px;"></div>
    <div style="font-size: 13px; margin: 4px 0;">
      メール: <a href="mailto:support@sns-share.com" style="color: #3B82F6; text-decoration: none;">support@sns-share.com</a><br>
      電話: 082-209-0181（平日10:00〜18:00 土日祝日休業）<br>
      ウェブ: <a href="https://app.sns-share.com" style="color: #3B82F6; text-decoration: none;">app.sns-share.com</a>
    </div>
    <div style="margin: 12px 0; font-style: italic; color: #4B5563; font-size: 13px; border-left: 3px solid #3B82F6; padding-left: 10px;">
      すべてのSNS、ワンタップでShare
    </div>
    <div style="font-size: 12px; color: #6B7280; margin-top: 8px;">
      〒731-0137 広島県広島市安佐南区山本2-3-35<br>
      運営: <a href="https://senrigan.systems" style="color: #3B82F6; text-decoration: none; font-weight: 500;" target="_blank">株式会社Senrigan</a>
    </div>
    <div style="margin-top: 10px;">
      <a href="https://app.sns-share.com/legal/privacy" style="display: inline-block; margin-right: 8px; color: #3B82F6; text-decoration: none;">プライバシーポリシー</a> | 
      <a href="https://app.sns-share.com/legal/terms" style="display: inline-block; margin-right: 8px; color: #3B82F6; text-decoration: none;">利用規約</a>
    </div>
  </div>
</div>
      `;
      try {
        // 管理者へのメール送信
        const { error: adminEmailError } = await resend.emails.send({
          from: `${siteName} <noreply@sns-share.com>`,
          to: [process.env.SUPPORT_EMAIL || 'support@sns-share.com'],
          subject: `【${siteName}】お問い合わせ: ${subject}`,
          html: adminHtmlContent,
        });
        if (adminEmailError) {
          logger.error('管理者へのメール送信エラー:', adminEmailError);
          return NextResponse.json(
            { message: 'メール送信に失敗しました', error: adminEmailError.message },
            { status: 500, headers },
          );
        }
        // ユーザーへの自動返信メール送信
        const { error: userEmailError } = await resend.emails.send({
          from: `${siteName} <noreply@sns-share.com>`,
          to: [email],
          subject: `【${siteName}】お問い合わせを受け付けました`,
          html: autoReplyHtmlContent,
        });
        if (userEmailError) {
          logger.error('ユーザーへのメール送信エラー:', userEmailError);
          // 管理者へのメールは送信できたので、ユーザーへのメール送信失敗のみログに残す
          logger.error('ユーザーへのメール送信に失敗しました:', userEmailError);
        }
      } catch (emailError) {
        logger.error('メール送信に失敗しました:', emailError);
        return NextResponse.json(
          {
            message: 'メール送信に失敗しました',
            error: emailError instanceof Error ? emailError.message : String(emailError),
          },
          { status: 500, headers },
        );
      }
    }
    return NextResponse.json(
      { message: 'お問い合わせが送信されました', success: true },
      { status: 200, headers },
    );
  } catch (error) {
    logger.error('お問い合わせエラー:', error);
    return NextResponse.json(
      { message: 'お問い合わせの送信中にエラーが発生しました', success: false },
      { status: 500, headers },
    );
  }
}