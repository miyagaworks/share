// types/sns.ts
export const SNS_PLATFORMS = [
  'line',
  'official-line',
  'youtube',
  'x',
  'instagram',
  'tiktok',
  'facebook',
  'pinterest',
  'threads',
  'note',
  'bereal',
] as const;

export type SnsPlatform = (typeof SNS_PLATFORMS)[number];

export interface SnsMetadata {
  name: string;
  icon: string;
  baseUrl: string;
  placeholderText: string;
  helpText: string;
}

export const SNS_METADATA: Record<SnsPlatform, SnsMetadata> = {
  line: {
    name: 'LINE',
    icon: 'line-icon.svg',
    baseUrl: '',
    placeholderText: 'LINEのURL',
    helpText: 'LINEアプリの共有からQRコードを表示し「URLをコピー」からURLを取得します',
  },
  'official-line': {
    name: '公式LINE',
    icon: 'line-icon.svg',
    baseUrl: '',
    placeholderText: '公式LINEのURL',
    helpText: 'LINE公式アカウントの友だちを増やすからのURLを貼り付けてください',
  },
  youtube: {
    name: 'YouTube',
    icon: 'youtube-icon.svg',
    baseUrl: 'https://youtube.com/@',
    placeholderText: 'ハンドル名（@マーク除く）',
    helpText: 'YouTubeチャンネルページのハンドル名を貼り付けてください',
  },
  x: {
    name: 'X',
    icon: 'x-icon.svg',
    baseUrl: 'https://x.com/',
    placeholderText: 'Xのユーザー名（@マーク除く）',
    helpText: '@マークなしでユーザー名を入力してください',
  },
  instagram: {
    name: 'Instagram',
    icon: 'instagram-icon.svg',
    baseUrl: 'https://www.instagram.com/',
    placeholderText: 'Instagramのユーザーネーム',
    helpText: '@マークなしでユーザーネームを入力してください',
  },
  tiktok: {
    name: 'TikTok',
    icon: 'tiktok-icon.svg',
    baseUrl: 'https://www.tiktok.com/@',
    placeholderText: 'TikTokユーザー名（@マーク除く）',
    helpText: '@マークなしでユーザー名を入力してください',
  },
  facebook: {
    name: 'Facebook',
    icon: 'facebook-icon.svg',
    baseUrl: 'https://www.facebook.com/',
    placeholderText: 'Facebookのユーザー名',
    helpText: 'FacebookプロフィールURLの最後の部分を入力してください',
  },
  pinterest: {
    name: 'Pinterest',
    icon: 'pinterest-icon.svg',
    baseUrl: 'https://www.pinterest.com/',
    placeholderText: 'Pinterestのユーザー名',
    helpText: 'Pinterestプロフィールのユーザー名を入力してください',
  },
  threads: {
    name: 'Threads',
    icon: 'threads-icon.svg',
    baseUrl: 'https://www.threads.net/@',
    placeholderText: 'Threadsのユーザー名',
    helpText: '@マークなしでユーザー名を入力してください',
  },
  note: {
    name: 'note',
    icon: 'note-icon.svg',
    baseUrl: 'https://note.com/',
    placeholderText: 'noteのユーザー名',
    helpText: 'noteのプロフィールURLからユーザー名を入力してください',
  },
  bereal: {
    name: 'BeReal',
    icon: 'bereal-icon.svg',
    baseUrl: '',
    placeholderText: 'BeRealのユーザー名',
    helpText: 'BeRealアプリのプロフィール共有からコピーしたURLを貼り付けてください',
  },
};