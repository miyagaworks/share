// lib/utils/expense-email.ts

import { sendEmail } from '@/lib/email';
import { getExpenseApprovalEmailTemplate } from '@/lib/email/templates/expense-approval';
import { getExpenseApprovalResultEmailTemplate } from '@/lib/email/templates/expense-approval-result';
import { logger } from '@/lib/utils/logger';

export async function sendExpenseApprovalEmail(params: {
  expenseId: string;
  title: string;
  amount: number;
  category: string;
  submitterName: string;
  submitterEmail: string;
  description?: string;
  expenseDate: string;
}) {
  try {
    const approvalUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.sns-share.com'}/dashboard/admin/company-expenses?expenseId=${params.expenseId}`;

    const emailTemplate = getExpenseApprovalEmailTemplate({
      ...params,
      approvalUrl,
    });

    const result = await sendEmail({
      to: 'admin@sns-share.com',
      subject: emailTemplate.subject,
      text: emailTemplate.text,
      html: emailTemplate.html,
    });

    logger.info('経費承認メール送信成功:', {
      expenseId: params.expenseId,
      amount: params.amount,
      submitter: params.submitterEmail,
      messageId: result.messageId,
    });

    return { success: true, messageId: result.messageId };
  } catch (error) {
    logger.error('経費承認メール送信エラー:', error);
    throw error;
  }
}

export async function sendExpenseApprovalResultEmail(params: {
  title: string;
  amount: number;
  category: string;
  expenseDate: string;
  approvalStatus: 'approved' | 'rejected';
  approverName: string;
  submitterName: string;
  submitterEmail: string;
  rejectionReason?: string;
}) {
  try {
    const emailTemplate = getExpenseApprovalResultEmailTemplate(params);

    const result = await sendEmail({
      to: params.submitterEmail,
      subject: emailTemplate.subject,
      text: emailTemplate.text,
      html: emailTemplate.html,
    });

    logger.info('経費承認結果メール送信成功:', {
      approvalStatus: params.approvalStatus,
      amount: params.amount,
      submitter: params.submitterEmail,
      messageId: result.messageId,
    });

    return { success: true, messageId: result.messageId };
  } catch (error) {
    logger.error('経費承認結果メール送信エラー:', error);
    throw error;
  }
}