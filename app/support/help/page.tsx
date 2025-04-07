// app/support/help/page.tsx
import Link from 'next/link';
import { PageLayout } from '@/components/layout/PageLayout';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ヘルプセンター | Share',
  description: 'Shareサービスのヘルプセンターです。よくある質問や使い方のガイドを提供しています。',
};

export default function HelpCenterPage() {
  return (
    <PageLayout
      title="ヘルプセンター"
      breadcrumbs={[
        { name: 'ホーム', href: '/' },
        { name: 'ヘルプセンター', href: '/support/help' },
      ]}
    >
      <div className="space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4">はじめての方へ</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">アカウント登録方法</h3>
              <p>新規ユーザー登録の手順を説明します。</p>
              <Link
                href="/support/help/registration"
                className="text-blue-600 hover:underline mt-2 inline-block"
              >
                詳細を見る →
              </Link>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">プロフィール設定</h3>
              <p>プロフィール情報の設定方法を説明します。</p>
              <Link
                href="/support/help/profile-setup"
                className="text-blue-600 hover:underline mt-2 inline-block"
              >
                詳細を見る →
              </Link>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">よく見られるヘルプ</h2>
          <ul className="space-y-2">
            <li className="p-3 bg-gray-50 rounded hover:bg-gray-100">
              <Link href="/support/help/sns-link" className="block">
                <h3 className="font-medium">SNSリンクの追加方法</h3>
                <p className="text-sm text-gray-600">
                  各SNSアカウントの追加・編集方法を説明します。
                </p>
              </Link>
            </li>
            <li className="p-3 bg-gray-50 rounded hover:bg-gray-100">
              <Link href="/support/help/qr-code" className="block">
                <h3 className="font-medium">QRコードの共有方法</h3>
                <p className="text-sm text-gray-600">
                  QRコードを使って自分のプロフィールを共有する方法を説明します。
                </p>
              </Link>
            </li>
            <li className="p-3 bg-gray-50 rounded hover:bg-gray-100">
              <Link href="/support/help/subscription" className="block">
                <h3 className="font-medium">サブスクリプションの管理</h3>
                <p className="text-sm text-gray-600">
                  プランの変更やキャンセル方法について説明します。
                </p>
              </Link>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4">カテゴリ別ヘルプ</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-3">アカウント管理</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/support/help/account/signup"
                    className="text-blue-600 hover:underline"
                  >
                    新規登録
                  </Link>
                </li>
                <li>
                  <Link
                    href="/support/help/account/login"
                    className="text-blue-600 hover:underline"
                  >
                    ログイン方法
                  </Link>
                </li>
                <li>
                  <Link
                    href="/support/help/account/password"
                    className="text-blue-600 hover:underline"
                  >
                    パスワードの変更
                  </Link>
                </li>
                <li>
                  <Link
                    href="/support/help/account/delete"
                    className="text-blue-600 hover:underline"
                  >
                    アカウント削除
                  </Link>
                </li>
              </ul>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-3">プロフィール設定</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/support/help/profile/edit" className="text-blue-600 hover:underline">
                    基本情報の編集
                  </Link>
                </li>
                <li>
                  <Link
                    href="/support/help/profile/image"
                    className="text-blue-600 hover:underline"
                  >
                    プロフィール画像の設定
                  </Link>
                </li>
                <li>
                  <Link
                    href="/support/help/profile/design"
                    className="text-blue-600 hover:underline"
                  >
                    デザインのカスタマイズ
                  </Link>
                </li>
              </ul>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-medium mb-3">SNS連携</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/support/help/sns/add" className="text-blue-600 hover:underline">
                    SNSリンクの追加
                  </Link>
                </li>
                <li>
                  <Link href="/support/help/sns/edit" className="text-blue-600 hover:underline">
                    SNSリンクの編集
                  </Link>
                </li>
                <li>
                  <Link href="/support/help/sns/order" className="text-blue-600 hover:underline">
                    表示順序の変更
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </PageLayout>
  );
}