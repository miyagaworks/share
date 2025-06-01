// types/user.ts
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
  mainColor?: string | null;
  textColor?: string | null;
}