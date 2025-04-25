// app/dashboard/corporate/sns/types.ts

export interface CorporateSnsLink {
  id: string;
  platform: string;
  username: string | null;
  url: string;
  displayOrder: number;
  isRequired: boolean;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}