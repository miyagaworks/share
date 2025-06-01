// app/dashboard/corporate/sns/types.ts
export interface CorporateSnsLink {
  id: string;
  tenantId: string;
  platform: string;
  username: string | null;
  url: string;
  displayOrder: number;
  isRequired: boolean;
  createdAt: string;
  updatedAt: string;
}