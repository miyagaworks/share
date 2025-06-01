// app/legal/privacy/page.tsx
import { PageLayout } from '@/components/layout/PageLayout';
import { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'プライバシーポリシー | Share',
  description: 'Shareサービスのプライバシーポリシーです。',
};
export default function PrivacyPage() {
  return (
    <PageLayout
      title="プライバシーポリシー"
      breadcrumbs={[
        { name: 'ホーム', href: '/' },
        { name: 'プライバシーポリシー', href: '/legal/privacy' },
      ]}
    >
      <div className="space-y-6">
        <section>
          <h2 className="text-xl font-semibold mb-3">1. はじめに</h2>
          <p className="text-justify">
            ビイアルファ株式会社（以下「当社」）は、提供するサービス「Share」（以下「本サービス」）における個人情報の取り扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」）を定めます。
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-3">2. 収集する情報</h2>
          <p className="text-justify">当社は、本サービスの提供にあたり、以下の情報を収集することがあります。</p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-justify">
            <li>氏名、メールアドレス、電話番号などの個人情報</li>
            <li>SNSアカウント情報</li>
            <li>利用履歴、アクセスログなどの利用情報</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-3">3. 利用目的</h2>
          <p className="text-justify">当社は、収集した情報を以下の目的で利用します。</p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-justify">
            <li>本サービスの提供・運営のため</li>
            <li>ユーザーサポートのため</li>
            <li>サービスの改善や新機能開発のため</li>
            <li>不正利用防止のため</li>
            <li>その他、当社のプライバシーポリシーに定める目的のため</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-3">4. 情報の共有</h2>
          <p className="text-justify">
            当社は、法令に基づく場合を除き、ユーザーの同意なく第三者に個人情報を提供することはありません。ただし、以下の場合には、ユーザーの個人情報を第三者に提供することがあります。
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-justify">
            <li>ユーザーの同意がある場合</li>
            <li>法令に基づく場合</li>
            <li>人の生命、身体または財産の保護のために必要がある場合</li>
            <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合</li>
            <li>
              国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合
            </li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-3">5. 情報の保護</h2>
          <p className="text-justify">
            当社は、ユーザーの個人情報を適切に保護するため、セキュリティ対策を講じております。個人情報への不正アクセス、紛失、破壊、改ざん、漏洩などのリスクに対して、技術的及び組織的な安全対策を実施しています。
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-3">6. ユーザーの権利</h2>
          <p className="text-justify">
            ユーザーは、当社に対して、自己の個人情報の開示、訂正、追加、削除、利用停止を請求することができます。請求を行う場合は、当社所定の手続きに従って行ってください。
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-3">7. Cookieの使用</h2>
          <p className="text-justify">
            当社のサービスでは、ユーザー体験の向上やサービス改善のために、Cookieを使用することがあります。Cookieの使用を望まない場合は、ブラウザの設定でCookieを無効にすることができますが、一部の機能が利用できなくなる可能性があります。
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-3 text-justify">8. プライバシーポリシーの変更</h2>
          <p className="text-justify">
            当社は、必要に応じて本ポリシーを変更することがあります。重要な変更がある場合は、本サービス上での通知や電子メールでユーザーに通知します。
          </p>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-3">9. お問い合わせ</h2>
          <p className="text-justify">本ポリシーに関するお問い合わせは、下記の連絡先までお願いいたします。</p>
          <p className="mt-2">
            ビイアルファ株式会社
            <br />
            メールアドレス: privacy@sns-share.com
          </p>
        </section>
      </div>
    </PageLayout>
  );
}