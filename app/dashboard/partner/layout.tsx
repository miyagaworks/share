// app/dashboard/partner/layout.tsx
'use client';

import { ReactNode } from 'react';

export default function PartnerLayout({ children }: { children: ReactNode }) {
  return <div className="partner-theme">{children}</div>;
}
