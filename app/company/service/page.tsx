// app/company/service/page.tsx
import { PageLayout } from '@/components/layout/PageLayout';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'サービスについて | Share',
  description: 'Shareサービスの特徴や機能についての詳細情報です。',
};

export default function ServiceAboutPage() {
  return (
    <PageLayout
      title="サービスについて"
      breadcrumbs={[
        { name: 'ホーム', href: '/' },
        { name: 'サービスについて', href: '/company/service' },
      ]}
    >
      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">Shareとは</h2>
          <p className="mb-4 text-justify">
            Shareは、複数のSNSアカウントと連絡先情報を一つのデジタルプロフィールにまとめ、QRコードやNFCを通じて簡単に共有できるプラットフォームです。
          </p>
          <p className="text-justify">
            現代社会では、人々は複数のSNSを使い分け、様々な連絡手段を持っています。それらをいちいち交換するのは手間がかかります。Shareはその問題を解決し、デジタル時代の新しい名刺として機能します。
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">主な特徴</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2 text-justify">複数SNSの一元管理</h3>
              <p className="text-justify">
                LINE、YouTube、X、Instagramなど10種類以上のSNSアカウントを一つのプロフィールにまとめて管理できます。
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">簡単な共有機能</h3>
              <p className="text-justify">
                QRコードを表示するだけで、相手はスキャンして簡単にあなたのSNSアカウントにアクセスできます。
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2 text-justify">カスタマイズ自由度</h3>
              <p className="text-justify">
                メインカラーを自由に設定でき、あなたの個性を表現できます。
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">端末最適化体験</h3>
              <p className="text-justify">
                iOSとAndroid両方に最適化されたユーザー体験を提供します。
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">利用シーン</h2>
          <div className="space-y-4">
            <div className="border-b pb-4">
              <h3 className="font-medium mb-2">ビジネスシーン</h3>
              <p className="text-justify">
                名刺の裏面にQRコードを印刷することで、名刺交換がデジタルとアナログを融合した体験へと進化します。相手はSNSや詳細なプロフィールにアクセスでき、単なる連絡先以上の人となりが伝わり、より深い関係構築のきっかけとなります。
              </p>
            </div>
            <div className="border-b pb-4">
              <h3 className="font-medium mb-2">交流会・イベント</h3>
              <p className="text-justify">
                新しい出会いの場で、素早く自分のSNSアカウントを共有。その場でフォローしあうことができ、つながりを即座に形成できます。
              </p>
            </div>
            <div className="border-b pb-4">
              <h3 className="font-medium mb-2">クリエイター活動</h3>
              <p className="text-justify">
                作品を発表しているSNSアカウントを一元的に共有でき、ファン獲得やフォロワー増加につながります。
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">日常のSNS共有</h3>
              <p className="text-justify">
                友人や知人に「SNSのアカウント教えて」と言われたとき、一つ一つ教える手間が省けます。Shareプロフィールを共有するだけで完了です。
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">料金プラン</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border rounded-lg p-6">
              <h3 className="font-medium text-lg mb-2">個人プラン</h3>
              <div className="text-2xl font-bold mb-4">
                月額500円<span className="text-sm font-normal text-gray-600">（税込）</span>
              </div>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                  <span>無制限のSNSリンク追加</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                  <span>カスタマイズ機能（メインカラー）</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                  <span>QRコード生成</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                  <span>標準サポート</span>
                </li>
              </ul>
              <p className="text-sm text-gray-600 mb-6 text-justify">
                ※年間プラン（5,000円/年）もご用意しています。
              </p>
            </div>

            <div className="border rounded-lg p-6">
              <h3 className="font-medium text-lg mb-2">法人プラン</h3>
              <div className="text-2xl font-bold mb-4">
                月額3,000円〜<span className="text-sm font-normal text-gray-600">（税込）</span>
              </div>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                  <span>複数ユーザー管理（10ユーザーから）</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                  <span>企業ブランディング設定</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                  <span>管理者ダッシュボード</span>
                </li>
                <li className="flex items-start">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    ></path>
                  </svg>
                  <span>優先サポート</span>
                </li>
              </ul>
              <p className="text-sm text-gray-600 text-justify">
                ※ユーザー数や機能に応じたカスタムプランもご相談ください。
              </p>
            </div>
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
