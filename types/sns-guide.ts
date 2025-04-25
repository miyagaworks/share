// types/sns-guide.ts

/**
 * SNSガイドのステップ情報
 */
export interface SnsGuideStep {
    title: string;
    description: string;
    imageUrl?: string;
}

/**
 * SNSガイドの全体情報
 */
export interface SnsGuide {
    platform: string;
    platformName: string;
    steps: SnsGuideStep[];
    additionalInfo?: string;
}

/**
 * 各SNSプラットフォームのガイド情報
 */
export const snsGuidesData: Record<string, SnsGuide> = {
  line: {
    platform: 'line',
    platformName: 'LINE',
    steps: [
      {
        title: 'LINEアプリを開く',
        description:
          'LINEアプリを開き、左下の「ホーム」タブから右上の友だち追加アイコンをタップします。',
        imageUrl: '/images/guides/line-step1.png',
      },
      {
        title: 'QRコードをタップ',
        description: '友だち追加から「QRコード」をタップします。',
        imageUrl: '/images/guides/line-step2.png',
      },
      {
        title: 'マイQRコードをタップ',
        description: 'カメラ画像の中央の「マイQRコード」をタップします。',
        imageUrl: '/images/guides/line-step3.png',
      },
      {
        title: 'リンクをコピー',
        description: '「リンクをコピー」をタップしてコピーします。',
        imageUrl: '/images/guides/line-step4.png',
      },
    ],
    additionalInfo: 'LINE IDとは別の文字列（英数字）となります。',
  },
  'official-line': {
    platform: 'official-line',
    platformName: '公式LINE',
    steps: [
      {
        title: 'Official Accountアプリを開く',
        description: 'Official Accountアプリを開き、「友だちを増やす」をタップします。',
        imageUrl: '/images/guides/lineofi-step1.png',
      },
      {
        title: 'URLを作成をタップ',
        description: '友だち追加用のURLを取得します。',
        imageUrl: '/images/guides/lineofi-step2.png',
      },
      {
        title: 'URLをコピー',
        description: 'URLをコピーしてShareに戻りフォームに貼り付けます。',
        imageUrl: '/images/guides/lineofi-step3.png',
      },
    ],
    additionalInfo: 'LINE IDとは別の文字列（英数字）となります。',
  },
  youtube: {
    platform: 'youtube',
    platformName: 'YouTube',
    steps: [
      {
        title: 'YouTube Studioにログイン',
        description:
          'アプリ（YT Studio）またはYouTube Studioにログインし、右上のプロフィールアイコンをタップします。',
        imageUrl: '/images/guides/youtube-step1.png',
      },
      {
        title: 'チャンネル編集ページに移動',
        description: 'チャンネル名右の鉛筆アイコンをタップし、「チャンネルの編集」へ移動します。',
        imageUrl: '/images/guides/youtube-step2.png',
      },
      {
        title: 'ハンドル名をコピー',
        description:
          '「@」以降の文字列があなたのハンドル名ですので、右の鉛筆アイコンをタップします。',
        imageUrl: '/images/guides/youtube-step3.png',
      },
      {
        title: 'ハンドル名をコピー',
        description: 'ハンドル名を2回タップするとコピーできるので、コピーします。',
        imageUrl: '/images/guides/youtube-step4.png',
      },
    ],
    additionalInfo: 'カスタムURLを設定している場合は、そちらを使用することもできます。',
  },
  x: {
    platform: 'x',
    platformName: 'X',
    steps: [
      {
        title: 'Xにログイン',
        description: 'Xアプリまたはウェブサイトにログインし、左上のアイコンをタップします。',
        imageUrl: '/images/guides/x-step1.png',
      },
      {
        title: 'ユーザー名を確認',
        description:
          'アカウント名の下に表示されている「@」から始まる文字列があなたのユーザー名です。',
        imageUrl: '/images/guides/x-step2.png',
      },
    ],
    additionalInfo: 'ユーザー名は設定画面から変更することができます。',
  },
  instagram: {
    platform: 'instagram',
    platformName: 'Instagram',
    steps: [
      {
        title: 'プロフィールページを開く',
        description: '右下（ウェブでは右上）のプロフィールアイコンをタップします。',
        imageUrl: '/images/guides/instagram-step1.png',
      },
      {
        title: 'ユーザーネームを確認',
        description: 'プロフィール画面の上部に表示されているユーザーネームを確認します。',
        imageUrl: '/images/guides/instagram-step2.png',
      },
    ],
    additionalInfo: 'プロフィールは公開設定にしておくことをおすすめします。',
  },
  tiktok: {
    platform: 'tiktok',
    platformName: 'TikTok',
    steps: [
      {
        title: 'TikTokにログイン',
        description: 'TikTokアプリを開き、右下の「プロフィール」タブをタップします。',
        imageUrl: '/images/guides/tiktok-step1.png',
      },
      {
        title: 'ユーザー名を確認',
        description: 'プロフィール画面で「@」から始まる文字列があなたのユーザー名です。',
        imageUrl: '/images/guides/tiktok-step2.png',
      },
    ],
    additionalInfo:
      'TikTokユーザー名は後から変更できますが、頻繁に変更すると一時的に変更できなくなる場合があります。',
  },
  facebook: {
    platform: 'facebook',
    platformName: 'Facebook',
    steps: [
      {
        title: 'メニューを開く',
        description: '右下のメニュー（プロフィール写真）をタップします',
        imageUrl: '/images/guides/facebook-step1.png',
      },
      {
        title: 'メニューページの名前をタップ',
        description: 'プロフィール写真と名前のところをタップします。',
        imageUrl: '/images/guides/facebook-step2.png',
      },
      {
        title: 'その他のメニュー',
        description: '「プロフィールを編集」の右「・・・」をタップします。',
        imageUrl: '/images/guides/facebook-step3.png',
      },
      {
        title: 'URLを確認',
        description:
          'プロフィール設定の一番下に「プロフィールリンクをコピー」とありますので、コピーせず「facebook.com/」の後に続く部分を入力下さい。',
        imageUrl: '/images/guides/facebook-step4.png',
      },
    ],
    additionalInfo:
      'Facebookでは、プライバシー設定によって公開範囲が制限されている場合があります。',
  },
  pinterest: {
    platform: 'pinterest',
    platformName: 'Pinterest',
    steps: [
      {
        title: 'Pinterestにログイン',
        description: 'Pinterestアプリにログインし、右下のプロフィールアイコンをタップします。',
        imageUrl: '/images/guides/pinterest-step1.png',
      },
      {
        title: 'アカウントページを開く',
        description: 'さらに左上のプロフィールアイコンをタップし、アカウントページへ移動します。',
        imageUrl: '/images/guides/pinterest-step2.png',
      },
      {
        title: 'プロフィールを見る',
        description: 'アカウントページから「プロフィールを見る」をタップします。',
        imageUrl: '/images/guides/pinterest-step3.png',
      },
      {
        title: 'ユーザー名を確認',
        description: 'プロフィールページのPinterstアイコンの後に続く部分があなたのユーザー名です。',
        imageUrl: '/images/guides/pinterest-step4.png',
      },
    ],
    additionalInfo:
      'Pinterestではボードとプロフィールのどちらも共有できますが、ここではプロフィールのURLを入力してください。',
  },
  threads: {
    platform: 'threads',
    platformName: 'Threads',
    steps: [
      {
        title: 'Threadsにログイン',
        description: 'プロフィールアイコンの右にユーザー名があるのでそれを入力します。',
        imageUrl: '/images/guides/threads-step1.png',
      },
    ],
    additionalInfo:
      'ThreadsユーザーネームはInstagramと連携しており、Instagramで変更するとThreadsでも変更されます。',
  },
  note: {
    platform: 'note',
    platformName: 'note',
    steps: [
      {
        title: 'アカウントを開く',
        description: '右下の「アカウント」アイコンをタップします。',
        imageUrl: '/images/guides/note-step1.png',
      },
      {
        title: 'ユーザー名を確認',
        description: '名前の下に表示されている英数字（アンダーバーあり）を正確に入力します。',
        imageUrl: '/images/guides/note-step2.png',
      },
    ],
    additionalInfo:
      'noteではマガジンとプロフィールの両方がありますが、ここではプロフィールの文字列を入力してください。',
  },
  bereal: {
    platform: 'bereal',
    platformName: 'BeReal',
    steps: [
      {
        title: 'BeRealアプリを開く',
        description: 'BeRealアプリを開き、右下のプロフィールアイコンをタップします。',
        imageUrl: '/images/guides/bereal-step1.png',
      },
      {
        title: 'プロフィールページを表示',
        description: 'プロフィール画面が表示されたら、右上の歯車アイコンをタップします。',
        imageUrl: '/images/guides/bereal-step2.png',
      },
      {
        title: 'ユーザーを確認',
        description: '設定メニューの上部にある名前の下があなたのユーザー名です。',
        imageUrl: '/images/guides/bereal-step3.png',
      },
    ],
    additionalInfo: 'BeRealプロフィールのURLは "https://bere.al/ユーザー名" の形式になります。',
  },
};