// GA4 カスタムイベント送信ユーティリティ
//
// TODO: GA4の gtag.js がまだ設置されていません。
// app/layout.tsx の <head> 内に以下を追加してください：
//
//   <Script
//     src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
//     strategy="afterInteractive"
//   />
//   <Script id="ga4-init" strategy="afterInteractive">
//     {`
//       window.dataLayer = window.dataLayer || [];
//       function gtag(){dataLayer.push(arguments);}
//       gtag('js', new Date());
//       gtag('config', 'G-XXXXXXXXXX');
//     `}
//   </Script>
//
// もしくは GTM 経由で設定してください。

declare global {
  interface Window {
    gtag?: (...args: [string, string, Record<string, unknown>?]) => void;
  }
}

export function trackEvent(
  eventName: string,
  params?: Record<string, unknown>,
) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, params);
  }
}

// パートナーLP 専用イベント
export const PartnerEvents = {
  lpView: () => trackEvent('partner_lp_view'),

  scrollDepth: (depth: number) =>
    trackEvent('partner_scroll_depth', { depth_percentage: depth }),

  sectionView: (sectionName: string) =>
    trackEvent('partner_section_view', { section_name: sectionName }),

  ctaClick: (location: string, type: string) =>
    trackEvent('partner_cta_click', { cta_location: location, cta_type: type }),

  calculatorUse: (customerCount: number, resultRevenue: number) =>
    trackEvent('partner_calculator_use', {
      customer_count: customerCount,
      result_revenue: resultRevenue,
    }),

  faqOpen: (questionText: string) =>
    trackEvent('partner_faq_open', { question_text: questionText }),

  formStart: () => trackEvent('partner_form_start'),

  formSubmit: (inquiryTypes: string[]) =>
    trackEvent('partner_form_submit', {
      inquiry_type: inquiryTypes.join(','),
    }),

  formError: (fieldName: string) =>
    trackEvent('partner_form_error', { field_name: fieldName }),
} as const;
