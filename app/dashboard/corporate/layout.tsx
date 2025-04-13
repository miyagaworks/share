// app/dashboard/corporate/layout.tsx
'use client';

import React, { ReactNode } from 'react';
import { CorporateAccessGuard } from '@/components/guards/CorporateAccessGuard';

interface CorporateLayoutProps {
  children: ReactNode;
}

export default function CorporateLayout({ children }: CorporateLayoutProps) {
  return <CorporateAccessGuard>{children}</CorporateAccessGuard>;
}