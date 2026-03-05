'use server';

import { z } from 'zod';
import { sendEmail } from '@/lib/email';
import {
  getPartnerAutoReplyTemplate,
  getPartnerAdminNotifyTemplate,
} from '@/lib/email/templates/partner-inquiry';
import { logger } from '@/lib/utils/logger';
import { prisma } from '@/lib/prisma';

const partnerInquirySchema = z.object({
  companyName: z
    .string()
    .min(1, '会社名を入力してください')
    .max(100, '100文字以内で入力してください'),
  name: z
    .string()
    .min(1, 'お名前を入力してください')
    .max(50, '50文字以内で入力してください'),
  email: z
    .string()
    .min(1, 'メールアドレスを入力してください')
    .email('正しいメールアドレスを入力してください'),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[0-9\-+()\s]*$/.test(val),
      '正しい電話番号を入力してください',
    ),
  preferences: z
    .array(z.string())
    .min(1, 'ご希望を1つ以上選択してください'),
  consultationDate1: z.string().optional(),
  consultationDate2: z.string().optional(),
  consultationDate3: z.string().optional(),
  question: z.string().max(1000).optional(),
});

export type PartnerInquiryResult = {
  success: boolean;
  errors?: Record<string, string>;
};

export async function submitPartnerInquiry(
  formData: FormData,
): Promise<PartnerInquiryResult> {
  const raw = {
    companyName: formData.get('companyName') as string,
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    phone: (formData.get('phone') as string) || undefined,
    preferences: formData.getAll('preferences') as string[],
    consultationDate1: (formData.get('consultationDate1') as string) || undefined,
    consultationDate2: (formData.get('consultationDate2') as string) || undefined,
    consultationDate3: (formData.get('consultationDate3') as string) || undefined,
    question: (formData.get('question') as string) || undefined,
  };

  const result = partnerInquirySchema.safeParse(raw);

  if (!result.success) {
    const errors: Record<string, string> = {};
    result.error.issues.forEach((issue) => {
      const key = issue.path[0] as string;
      if (!errors[key]) errors[key] = issue.message;
    });
    return { success: false, errors };
  }

  const data = result.data;
  logger.info('Partner inquiry received:', data);

  try {
    // 0. DB保存
    await prisma.partnerInquiry.create({
      data: {
        companyName: data.companyName,
        name: data.name,
        email: data.email,
        phone: data.phone,
        preferences: data.preferences,
        consultationDate1: data.consultationDate1,
        consultationDate2: data.consultationDate2,
        consultationDate3: data.consultationDate3,
        question: data.question,
      },
    });

    // 1. お客様への自動返信メール（資料ダウンロードリンク付き）
    const autoReply = getPartnerAutoReplyTemplate({
      name: data.name,
      companyName: data.companyName,
      preferences: data.preferences,
    });
    await sendEmail({
      to: data.email,
      subject: autoReply.subject,
      text: autoReply.text,
      html: autoReply.html,
    });

    // 2. 管理者への通知メール
    const adminEmail = process.env.ADMIN_EMAIL || 'info@sns-share.com';
    const adminNotify = getPartnerAdminNotifyTemplate({
      name: data.name,
      companyName: data.companyName,
      email: data.email,
      phone: data.phone,
      preferences: data.preferences,
      consultationDates: [
        data.consultationDate1,
        data.consultationDate2,
        data.consultationDate3,
      ].filter(Boolean) as string[],
      question: data.question,
    });
    await sendEmail({
      to: adminEmail,
      subject: adminNotify.subject,
      text: adminNotify.text,
      html: adminNotify.html,
    });

    logger.info('Partner inquiry emails sent successfully');
    return { success: true };
  } catch (error) {
    logger.error('Partner inquiry email error:', error);
    return { success: false };
  }
}
