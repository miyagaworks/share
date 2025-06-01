// lib/utils/notification-helpers.ts
import { logger } from "@/lib/utils/logger";
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';
/**
 * 通知を既読にするヘルパー関数
 */
export async function markNotificationAsRead(notificationId: string, userId: string) {
  try {
    // 既読レコードがあるか確認
    const existingRead = await prisma.notificationRead.findFirst({
      where: {
        notificationId,
        user_id: userId,
      },
    });
    if (!existingRead) {
      // 既読レコードがなければ作成
      return await prisma.notificationRead.create({
        data: {
          id: uuidv4(),
          notificationId,
          user_id: userId,
          readAt: new Date(),
        },
      });
    }
    return existingRead;
  } catch (error) {
    logger.error('既読設定ヘルパーエラー:', error);
    throw error;
  }
}