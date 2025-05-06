// lib/utils/activity-logger.ts
import { prisma } from '@/lib/prisma';
import { logger } from './logger';

type ActivityAction =
  | 'create_user'
  | 'update_user'
  | 'delete_user'
  | 'create_department'
  | 'update_department'
  | 'delete_department'
  | 'update_branding'
  | 'update_sns'
  | 'update_settings'
  | 'login'
  | 'logout'
  | 'invite_user'
  | 'accept_invite';

type EntityType = 'user' | 'department' | 'tenant' | 'sns_link' | 'settings';

// Prismaが受け付けるJSON値の型（簡易版）
type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
type JsonObject = { [key: string]: JsonValue };
type JsonArray = JsonValue[];

interface LogActivityParams {
  tenantId: string;
  userId?: string;
  action: ActivityAction;
  entityType: EntityType;
  entityId?: string;
  description: string;
  metadata?: JsonObject; // JSON互換のオブジェクト型
}

/**
 * 法人テナント内のアクティビティをログに記録する関数
 */
export async function logCorporateActivity({
  tenantId,
  userId,
  action,
  entityType,
  entityId,
  description,
  metadata,
}: LogActivityParams) {
  try {
    // アクティビティの詳細をログに記録
    logger.info('アクティビティ記録', {
      tenantId,
      userId,
      action,
      entityType,
      entityId,
      description,
    });

    // アクティビティログを作成
    const activityLog = await prisma.corporateActivityLog.create({
      data: {
        tenantId,
        userId,
        action,
        entityType,
        entityId,
        description,
        metadata: metadata || {}, // JSONオブジェクト
      },
    });

    return { success: true, activityLog };
  } catch (error) {
    // エラーログの詳細化
    logger.error('アクティビティログの記録に失敗', error, {
      tenantId,
      action,
      entityType,
    });
    return { success: false, error };
  }
}

/**
 * ユーザー関連のアクティビティをログに記録するためのヘルパー関数
 */
export async function logUserActivity(
  tenantId: string,
  actorUserId: string,
  targetUserId: string,
  action: 'create_user' | 'update_user' | 'delete_user' | 'invite_user',
  description: string,
  metadata?: JsonObject, // JSON互換のオブジェクト型
) {
  return logCorporateActivity({
    tenantId,
    userId: actorUserId,
    action,
    entityType: 'user',
    entityId: targetUserId,
    description,
    metadata,
  });
}

/**
 * 設定変更のアクティビティをログに記録するためのヘルパー関数
 */
export async function logSettingsActivity(
  tenantId: string,
  userId: string,
  settingsType: string,
  description: string,
  metadata?: JsonObject, // JSON互換のオブジェクト型
) {
  return logCorporateActivity({
    tenantId,
    userId,
    action: 'update_settings',
    entityType: 'settings',
    entityId: settingsType,
    description,
    metadata,
  });
}