// app/api/support/contact/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sendEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const session = await auth();
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
    console.log('お問い合わせ内容:', {
      name,
      email,
      companyName: companyName || null,
      type: contactType,
      subject,
      message: message.substring(0, 100) + '...',
      userId: session?.user?.id || null,
    });

    // 法人プランのお問い合わせの場合は特別な処理
    if (contactType === 'corporate') {
      console.log('法人プランのお問い合わせがありました。', {
        company: companyName,
        name,
        email,
        subject,
      });

      // 開発環境でも動作するメール送信処理
      await sendEmail({
        to: process.env.ADMIN_EMAIL || 'support@sns-share.com',
        subject: `【重要】法人プランのお問い合わせ: ${subject}`,
        text: `
法人プランのお問い合わせがありました。

【会社名】${companyName}
【担当者名】${name}
【メールアドレス】${email}
【件名】${subject}
【メッセージ】
${message}

※このお問い合わせは優先対応が必要です。1営業日以内に返信してください。
        `,
      });
    } else {
      // 通常のお問い合わせ処理
      console.log('お問い合わせがありました。', {
        name,
        email,
        type: contactType,
        subject,
      });

      // 開発環境でも動作するメール送信処理
      await sendEmail({
        to: process.env.SUPPORT_EMAIL || 'support@sns-share.com',
        subject: `【Share】お問い合わせ: ${subject}`,
        text: `
新しいお問い合わせが届きました。

【名前】${name}
【メールアドレス】${email}
【種類】${contactType}
【件名】${subject}
【メッセージ】
${message}
        `,
      });
    }

    // 開発環境でもフロントエンドに成功を返す
    return NextResponse.json(
      { message: 'お問い合わせが送信されました', success: true },
      { status: 200 },
    );
  } catch (error) {
    console.error('お問い合わせエラー:', error);
    return NextResponse.json(
      { message: 'お問い合わせの送信中にエラーが発生しました', success: false },
      { status: 500 },
    );
  }
}