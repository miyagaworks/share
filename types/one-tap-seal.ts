// types/one-tap-seal.ts
export const ONE_TAP_SEAL_COLORS = ['black', 'gray', 'white'] as const;
export type OneTapSealColor = (typeof ONE_TAP_SEAL_COLORS)[number];

export const ONE_TAP_SEAL_STATUS = [
  'pending',
  'paid',
  'preparing',
  'shipped',
  'delivered',
] as const;
export type OneTapSealStatus = (typeof ONE_TAP_SEAL_STATUS)[number];

export const ORDER_TYPES = ['individual', 'corporate'] as const;
export type OrderType = (typeof ORDER_TYPES)[number];

// 基本設定
export const ONE_TAP_SEAL_CONFIG = {
  UNIT_PRICE: 550, // 税込
  SHIPPING_FEE: 185, // 税込
  TAX_RATE: 0, // 税込価格のため税率0
  MAX_QUANTITY_PER_COLOR: 100, // 1色あたり最大100枚
  MAX_TOTAL_QUANTITY: 100, // 合計最大100枚
} as const;

// 色の表示名
export const ONE_TAP_SEAL_COLOR_NAMES: Record<OneTapSealColor, string> = {
  black: 'ブラック',
  gray: 'グレー',
  white: 'ホワイト',
};

// ステータスの表示名
export const ONE_TAP_SEAL_STATUS_NAMES: Record<OneTapSealStatus, string> = {
  pending: '注文受付中',
  paid: '支払い完了',
  preparing: '準備中',
  shipped: '発送済み',
  delivered: '配送完了',
};

// 配送先情報（基本）
export interface ShippingAddress {
  postalCode: string;
  address: string;
  recipientName: string;
}

// 配送先情報（拡張版）
export interface EnhancedShippingAddress {
  postalCode: string;
  address: string; // 番地まで
  building?: string; // マンション名・部屋番号
  companyName?: string; // 会社名（任意）
  recipientName: string; // お届け先名（山田 太郎 形式）
}

// 注文アイテム（データベース構造）
export interface OneTapSealItem {
  id: string;
  orderId: string;
  memberUserId: string | null;
  color: OneTapSealColor;
  quantity: number;
  unitPrice: number;
  profileSlug: string; // 新規追加: NFCタグ書き込み用
  qrSlug?: string; // 後方互換性のため保持（QRコード表示用）
  createdAt: string;
  memberName?: string | null;
  memberEmail?: string | null;
}

// プロフィールスラッグ情報（新規追加）
export interface ProfileSlugInfo {
  slug: string;
  isExisting: boolean;
  isAvailable: boolean;
  userId?: string;
  userName?: string;
  profileUrl: string; // 完全なプロフィールURL
}

// 注文作成用のアイテム型（idやorderId、createdAtなし）
export interface CreateOneTapSealItem {
  color: OneTapSealColor;
  quantity: number;
  profileSlug: string; // qrSlug → profileSlug に変更
  memberUserId?: string;
}

// バリデーション用のアイテム型（unitPriceを含む）
export interface ValidationOneTapSealItem extends CreateOneTapSealItem {
  unitPrice: number;
}

// 注文データ（データベース構造）
export interface OneTapSealOrder {
  id: string;
  userId: string;
  tenantId: string | null;
  subscriptionId: string | null;
  orderType: OrderType;
  orderDate: string;
  status: OneTapSealStatus;
  sealTotal: number;
  shippingFee: number;
  taxAmount: number;
  totalAmount: number;
  shippingAddress: EnhancedShippingAddress;
  trackingNumber: string | null;
  shippedAt: string | null;
  shippedBy: string | null;
  stripePaymentIntentId: string | null;
  createdAt: string;
  updatedAt: string;
  items: OneTapSealItem[];
  tenant?: {
    name: string;
  } | null;
  user?: {
    name?: string | null;
    email: string;
  };
}

// 注文作成リクエスト
export interface CreateOneTapSealOrderRequest {
  orderType: OrderType;
  items: CreateOneTapSealItem[];
  shippingAddress: EnhancedShippingAddress;
  tenantId?: string; // 法人注文時
}

// 注文計算結果
export interface OrderCalculation {
  sealTotal: number; // シール代金小計（税込）
  shippingFee: number; // 配送料（税込）
  taxAmount: number; // 消費税（0円）
  totalAmount: number; // 合計（税込）
  itemCount: number; // アイテム総数
}

// バリデーション結果
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// 注文ステップ
export type OrderStep = 'items' | 'url' | 'address' | 'confirm';

// 色・数量選択
export interface OneTapSealSelection {
  black: number;
  gray: number;
  white: number;
}

// QRスラッグ情報
export interface QrSlugInfo {
  slug: string;
  isExisting: boolean;
  isAvailable: boolean;
  userId?: string;
  userName?: string;
}

// メンバーQRスラッグ情報（法人用）
export interface MemberQrSlugInfo {
  userId: string;
  name: string;
  email: string;
  existingSlugs: string[];
  hasNoSlug: boolean;
}