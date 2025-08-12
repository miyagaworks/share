// app/legal/transactions/page.tsx
import { PageLayout } from '@/components/layout/PageLayout';
import { Metadata } from 'next';
export const metadata: Metadata = {
  title: '特定商取引法に基づく表記 | Share',
  description: 'Shareサービスの特定商取引法に基づく表記です。',
};
export default function TransactionsPage() {
  return (
    <PageLayout
      title="特定商取引法に基づく表記"
      breadcrumbs={[
        { name: 'ホーム', href: '/' },
        { name: '特定商取引法に基づく表記', href: '/legal/transactions' },
      ]}
    >
      <div className="space-y-6">
        <section>
          <table className="w-full border-collapse">
            <tbody>
              <tr className="border-b">
                <th className="text-left py-4 px-4 font-semibold bg-gray-50 w-1/3">販売事業者</th>
                <td className="py-4 px-4">株式会社Senrigan</td>
              </tr>
              <tr className="border-b">
                <th className="text-left py-4 px-4 font-semibold bg-gray-50">代表者名</th>
                <td className="py-4 px-4">宮川 清実</td>
              </tr>
              <tr className="border-b">
                <th className="text-left py-4 px-4 font-semibold bg-gray-50">所在地</th>
                <td className="py-4 px-4">
                  〒731-0137
                  <br />
                  広島県広島市安佐南区山本2-3-35
                </td>
              </tr>
              <tr className="border-b">
                <th className="text-left py-4 px-4 font-semibold bg-gray-50">電話番号</th>
                <td className="py-4 px-4">
                  082-209-0181
                  <br />
                  （平日10:00〜18:00 土日祝日休業）
                </td>
              </tr>
              <tr className="border-b">
                <th className="text-left py-4 px-4 font-semibold bg-gray-50">メールアドレス</th>
                <td className="py-4 px-4">info@sns-share.com</td>
              </tr>
              <tr className="border-b">
                <th className="text-left py-4 px-4 font-semibold bg-gray-50">サービス名</th>
                <td className="py-4 px-4">Share</td>
              </tr>
              <tr className="border-b">
                <th className="text-left py-4 px-4 font-semibold bg-gray-50">サービス価格</th>
                <td className="py-4 px-4">
                  <ul className="list-disc pl-5 space-y-1 text-justify">
                    <li>個人プラン: 月額550円（税込）</li>
                    <li>個人プラン（年間）: 年額5,500円（税込）</li>
                    <li>法人スタータープラン: 月額3,300円（税込）〜</li>
                  </ul>
                </td>
              </tr>
              <tr className="border-b">
                <th className="text-left py-4 px-4 font-semibold bg-gray-50">支払方法</th>
                <td className="py-4 px-4 text-justify">
                  クレジットカード決済（VISA、MasterCard、JCB、American Express、Diners Club）
                </td>
              </tr>
              <tr className="border-b">
                <th className="text-left py-4 px-4 font-semibold bg-gray-50">支払時期</th>
                <td className="py-4 px-4 text-justify">
                  月額プラン: 申込時および契約更新時に1か月分の利用料をお支払いいただきます。
                  <br />
                  年間プラン: 申込時および契約更新時に1年分の利用料をお支払いいただきます。
                </td>
              </tr>
              <tr className="border-b">
                <th className="text-left py-4 px-4 font-semibold bg-gray-50">サービス提供時期</th>
                <td className="py-4 px-4 text-justify">
                  お申込み完了後、すぐにサービスをご利用いただけます。
                </td>
              </tr>
              <tr className="border-b">
                <th className="text-left py-4 px-4 font-semibold bg-gray-50">返品・キャンセル</th>
                <td className="py-4 px-4 text-justify">
                  デジタルコンテンツのため、原則として返品・キャンセルはできません。ただし、法令に基づく場合はこの限りではありません。
                </td>
              </tr>
              <tr className="border-b">
                <th className="text-left py-4 px-4 font-semibold bg-gray-50">解約方法</th>
                <td className="py-4 px-4 text-justify">
                  アカウント設定画面から解約手続きを行うことができます。解約後は、契約期間の終了をもってサービスの提供が終了します。
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </div>
    </PageLayout>
  );
}
