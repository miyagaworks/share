// app/support/contact/page.tsx
import { Suspense } from 'react';
import { headers } from 'next/headers';
import ContactPageContent from './ContactPageContent';
import { getBrandConfig } from '@/lib/brand/config';
import { resolveBrandByHostname } from '@/lib/brand/resolve';

export default async function ContactPage() {
  // ブランド情報を解決
  const defaultBrand = getBrandConfig();
  let brandName = defaultBrand.name;
  let supportEmail = defaultBrand.supportEmail;
  let companyPhone = defaultBrand.companyPhone;
  let companyAddress = defaultBrand.companyAddress;
  let companyName = defaultBrand.companyName;

  try {
    const headersList = await headers();
    const host = headersList.get('host');
    if (host) {
      const resolved = await resolveBrandByHostname(host);
      if (resolved.isPartner) {
        brandName = resolved.name;
        if (resolved.supportEmail) supportEmail = resolved.supportEmail;
        if (resolved.companyName) companyName = resolved.companyName;
        if (resolved.companyAddress) companyAddress = resolved.companyAddress;
      }
    }
  } catch {
    // フォールバック: デフォルトブランド
  }

  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        </div>
      }
    >
      <ContactPageContent
        brandName={brandName}
        supportEmail={supportEmail}
        companyPhone={companyPhone}
        companyAddress={companyAddress}
        companyName={companyName}
      />
    </Suspense>
  );
}
