// types/profiles.ts
import { Department } from '@prisma/client';
export interface UserData {
  id: string;
  email: string;
  name: string | null;
  nameEn: string | null;
  nameKana: string | null;
  lastName: string | null;
  firstName: string | null;
  lastNameKana: string | null;
  firstNameKana: string | null;
  image: string | null;
  bio: string | null;
  phone: string | null;
  position: string | null;
  department?: Department | null;
  company?: string | null;
  companyUrl?: string | null;
  companyLabel?: string | null;
  mainColor: string | null;
  snsIconColor: string | null;
  bioBackgroundColor: string | null;
  bioTextColor: string | null;
  headerText: string | null;
  textColor: string | null;
}
export interface ProfileUpdateData {
  // 分割されたフィールド（新形式）
  lastName?: string | null;
  firstName?: string | null;
  lastNameKana?: string | null;
  firstNameKana?: string | null;
  // 結合されたフィールド（従来形式、互換性のため）
  name?: string | null;
  nameEn?: string | null;
  nameKana?: string | null;
  // その他の共通フィールド
  bio?: string | null;
  image?: string | null;
  phone?: string | null;
  company?: string | null;
  companyUrl?: string | null;
  companyLabel?: string | null;
  // カラー関連フィールド
  mainColor?: string | null;
  snsIconColor?: string | null;
  bioBackgroundColor?: string | null;
  bioTextColor?: string | null;
  headerText?: string | null;
  textColor?: string | null;
  // その他のフィールド
  position?: string | null;
}