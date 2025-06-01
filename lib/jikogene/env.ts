// lib/jikogene/env.ts
import { logger } from "@/lib/utils/logger";
/**
 * 環境変数の検証を行う関数
 * アプリケーション起動時に必要な環境変数が設定されているか確認
 */
export function validateEnv() {
  const requiredEnvVars = ['GEMINI_API_KEY'];
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`環境変数 ${envVar} が設定されていません。.envファイルを確認してください。`);
    }
  }
}
