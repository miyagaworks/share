// app/support/faq/page.tsx
import { PageLayout } from '@/components/layout/PageLayout';
import { FaqSection } from '@/components/shared/FaqSection';
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'よくある質問 | Share',
  description: 'Shareサービスに関するよくある質問と回答です。',
};

// FAQ データの定義
const generalFaqs = [
  {
    question: 'Shareとは何ですか？',
    answer: (
      <p className="text-justify">
        Shareは、複数のSNSアカウントと連絡先情報を一つのデジタルプロフィールにまとめ、QRコードやNFCを通じて簡単に共有できるプラットフォームです。名刺交換のデジタル版として、ビジネスやプライベートでのコミュニケーションをスムーズにします。
      </p>
    ),
  },
  {
    question: '無料で利用できますか？',
    answer: (
      <p className="text-justify">
        Shareには7日間の無料トライアル期間があります。その後は月額500円（税込）または年額5,000円（税込）の有料プランに移行していただく必要があります。有料プランでは、すべての機能を制限なくご利用いただけます。
      </p>
    ),
  },
  {
    question: '対応しているSNSは何がありますか？',
    answer: (
      <div>
        <p className="text-justify">Shareでは以下のSNSに対応しています：</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2">
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-blue-500 mr-2 flex-shrink-0"></div>
            <span>LINE</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-blue-500 mr-2 flex-shrink-0"></div>
            <span>YouTube</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-blue-500 mr-2 flex-shrink-0"></div>
            <span>X（旧Twitter）</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-blue-500 mr-2 flex-shrink-0"></div>
            <span>Instagram</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-blue-500 mr-2 flex-shrink-0"></div>
            <span>TikTok</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-blue-500 mr-2 flex-shrink-0"></div>
            <span>Facebook</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-blue-500 mr-2 flex-shrink-0"></div>
            <span>Pinterest</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-blue-500 mr-2 flex-shrink-0"></div>
            <span>Threads</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-blue-500 mr-2 flex-shrink-0"></div>
            <span>note</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-blue-500 mr-2 flex-shrink-0"></div>
            <span>BeReal</span>
          </div>
        </div>
        <p className="mt-3 text-justify">
          また、カスタムリンクも追加できるため、上記以外のサービスも登録可能です。
        </p>
      </div>
    ),
  },
];

const accountFaqs = [
  {
    question: 'アカウントの作成方法を教えてください',
    answer: (
      <p className="text-justify">
        トップページの「アカウント作成」ボタンから、メールアドレスとパスワードを入力して登録できます。また、Googleアカウントを使用したログインも可能です。登録後、基本的なプロフィール情報の設定を行い、すぐにサービスをご利用いただけます。
      </p>
    ),
  },
  {
    question: 'パスワードを忘れてしまいました',
    answer: (
      <p className="text-justify">
        ログイン画面の「パスワードをお忘れですか？」リンクから、登録しているメールアドレスにパスワードリセット用のリンクをお送りすることができます。メールに記載されているリンクをクリックして、新しいパスワードを設定してください。
      </p>
    ),
  },
  {
    question: 'アカウントを削除するにはどうすればいいですか？',
    answer: (
      <p className="text-justify">
        アカウント設定画面の「アカウント削除」セクションから削除手続きを行うことができます。アカウント削除を行うと、すべてのデータが完全に削除され、復元することはできませんのでご注意ください。また、アカウント削除後も当月分の料金は返金されません。
      </p>
    ),
  },
];

const billingFaqs = [
  {
    question: '支払い方法は何がありますか？',
    answer: (
      <p className="text-justify">
        Shareでは、クレジットカード決済（VISA、MasterCard、JCB、American Express、Diners
        Club）に対応しています。銀行振込やコンビニ決済には現在対応しておりません。
      </p>
    ),
  },
  {
    question: '請求書や領収書は発行できますか？',
    answer: (
      <p className="text-justify">
        法人プランをご利用のお客様には、管理者画面から請求書のダウンロードが可能です。個人プランの場合は、お支払い時に自動送信される決済確認メールを領収書としてご利用いただけます。別途領収書が必要な場合は、お問い合わせフォームからご連絡ください。
      </p>
    ),
  },
  {
    question: '解約方法を教えてください',
    answer: (
      <p className="text-justify">
        「ご利用プラン」ページから解約手続きを行うことができます。解約手続きを行っても、契約期間の終了までサービスをご利用いただけます。なお、解約後の日割り返金はございませんので、ご了承ください。
      </p>
    ),
  },
];

export default function FaqPage() {
  return (
    <PageLayout
      title="よくある質問"
      breadcrumbs={[
        { name: 'ホーム', href: '/' },
        { name: 'サポート', href: '/support' },
        { name: 'よくある質問', href: '/support/faq' },
      ]}
    >
      <div className="space-y-8">
        <p className="text-lg text-gray-700 mb-8 text-justify">
          Shareサービスに関するよくあるご質問をまとめました。お探しの情報が見つからない場合は、
          <Link href="/support/contact" className="text-blue-600 hover:underline">
            お問い合わせフォーム
          </Link>
          からお気軽にお問い合わせください。
        </p>

        <div className="space-y-8">
          <FaqSection title="サービスについて" faqs={generalFaqs} />
          <FaqSection title="アカウント関連" faqs={accountFaqs} />
          <FaqSection title="お支払い・解約" faqs={billingFaqs} />
        </div>
      </div>
    </PageLayout>
  );
}
