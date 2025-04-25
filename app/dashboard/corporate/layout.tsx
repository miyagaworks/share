// app/dashboard/corporate/layout.tsx
'use client';

import React, { ReactNode } from 'react';

interface CorporateLayoutProps {
  children: ReactNode;
}

export default function CorporateLayout({ children }: CorporateLayoutProps) {
  return <div className="w-full max-w-full box-border">{children}</div>;
}