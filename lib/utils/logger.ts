// lib/utils/logger.ts

// any型を避けてunknownを使用
type LogData = unknown[];

// 内部的に使用する型（外部には公開しない）
enum LogLevelEnum {
  debug = 0,
  info = 1,
  warn = 2,
  error = 3,
}

// 本番環境では'info'以上のログのみ表示
const CURRENT_LOG_LEVEL =
  process.env.NODE_ENV === 'production' ? LogLevelEnum.warn : LogLevelEnum.debug;

/**
 * 統合ロガー
 * 環境に応じて適切なログレベルで出力する
 */
export const logger = {
  debug: (message: string, ...data: LogData) => {
    if (LogLevelEnum.debug >= CURRENT_LOG_LEVEL) {
      console.debug(`[DEBUG] ${message}`, ...data);
    }
  },

  info: (message: string, ...data: LogData) => {
    if (LogLevelEnum.info >= CURRENT_LOG_LEVEL) {
      console.info(`[INFO] ${message}`, ...data);
    }
  },

  warn: (message: string, ...data: LogData) => {
    if (LogLevelEnum.warn >= CURRENT_LOG_LEVEL) {
      console.warn(`[WARN] ${message}`, ...data);
    }
  },

  error: (message: string, error?: unknown, ...data: LogData) => {
    if (LogLevelEnum.error >= CURRENT_LOG_LEVEL) {
      // エラーオブジェクトを整形
      const errorDetails =
        error instanceof Error ? { message: error.message, stack: error.stack } : error;

      console.error(`[ERROR] ${message}`, errorDetails, ...data);

      // 本番環境では外部エラー追跡サービスに送信
      if (process.env.NODE_ENV === 'production') {
        // ここに外部サービス（Sentry等）連携コードを追加
      }
    }
  },

  // 法人アクセス関連のログ専用
  corporate: (action: string, data: unknown) => {
    if (LogLevelEnum.info >= CURRENT_LOG_LEVEL) {
      console.log(`[CORPORATE:${action}]`, data);
    }
  },
};