// components/corporate/MemberSnsManager.tsx
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'react-hot-toast';
import { type SnsPlatform, SNS_METADATA } from '@/types/sns';
import { ImprovedSnsIcon } from '@/components/shared/ImprovedSnsIcon';
import { SnsGuideModalWithDescription } from '@/components/shared/SnsGuideModalWithDescription';
import {
  HiPlus,
  HiPencil,
  HiTrash,
  HiLink,
  HiExternalLink,
  HiCheck,
  HiX,
  HiInformationCircle,
} from 'react-icons/hi';
// 型定義
interface SnsLink {
  id: string;
  platform: string;
  username: string | null;
  url: string;
  displayOrder: number;
}
interface CustomLink {
  id: string;
  name: string;
  url: string;
  displayOrder: number;
}
interface TenantData {
  id: string;
  name: string;
  primaryColor: string | null;
  secondaryColor: string | null;
  corporatePrimary?: string | null;
  corporateSecondary?: string | null;
}
// props型の定義を更新
interface MemberSnsManagerProps {
  personalSnsLinks: SnsLink[];
  customLinks: CustomLink[];
  tenantData: TenantData | null;
  corporatePlatforms: string[];
  corporatePlatformUrls?: {
    // オプショナルにして後方互換性を保持
    [key: string]: {
      username: string | null;
      url: string;
    };
  };
  onSnsLinkUpdate: (updatedLinks: SnsLink[]) => void;
  onCustomLinkUpdate: (updatedLinks: CustomLink[]) => void;
}
export function MemberSnsManager({
  personalSnsLinks,
  customLinks,
  tenantData,
  corporatePlatforms,
  corporatePlatformUrls = {}, // デフォルト値を空オブジェクトに
  onSnsLinkUpdate,
  onCustomLinkUpdate,
}: MemberSnsManagerProps) {
  // テナントカラーの取得（優先順位を考慮）
  const primaryColor =
    tenantData?.primaryColor || tenantData?.corporatePrimary || 'var(--color-corporate-primary)';
  // 以下を追加 - corporatePlatformUrlsの参照を保存
  const corporatePlatformUrlsRef = useRef(corporatePlatformUrls);
  // props変更時に参照を更新
  useEffect(() => {
    corporatePlatformUrlsRef.current = corporatePlatformUrls;
  }, [corporatePlatformUrls]);
  // 編集モード状態
  const [editingSnsId, setEditingSnsId] = useState<string | null>(null);
  const [editingCustomId, setEditingCustomId] = useState<string | null>(null);
  // 新規追加モード状態
  const [isAddingSns, setIsAddingSns] = useState(false);
  const [isSelectingSnsType, setIsSelectingSnsType] = useState(false);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  // SNS詳細ガイド
  const [showSnsGuide, setShowSnsGuide] = useState(false);
  const [guidePlatform, setGuidePlatform] = useState<SnsPlatform | null>(null);
  // フォーム状態
  const [snsForm, setSnsForm] = useState({
    platform: '',
    username: '',
    url: '',
  });
  const [customForm, setCustomForm] = useState({
    name: '',
    url: '',
  });
  // SNSプラットフォームのリスト（useMemoでラップ）
  const availablePlatforms = useMemo(
    () => [
      'LINE',
      '公式LINE',
      'YouTube',
      'X',
      'Instagram',
      'TikTok',
      'Facebook',
      'Pinterest',
      'Threads',
      'note',
      'BeReal',
    ],
    [],
  );
  // 既に使用されているプラットフォームを除外
  const usedPlatforms = useMemo(
    () => [...personalSnsLinks.map((link) => link.platform), ...corporatePlatforms],
    [personalSnsLinks, corporatePlatforms],
  );
  const unusedPlatforms = useMemo(
    () => availablePlatforms.filter((p) => !usedPlatforms.includes(p)),
    [availablePlatforms, usedPlatforms],
  );
  // プラットフォーム別のURLとユーザー名のプレースホルダー
  const platformPlaceholders = useMemo(
    () => ({
      LINE: {
        username: 'https://line.me/ti/p/xxxx',
        url: '',
      },
      公式LINE: {
        username: 'https://lin.ee/xxxx',
        url: '',
      },
      YouTube: {
        username: 'チャンネル名',
        url: 'https://www.youtube.com/@',
      },
      X: {
        username: 'Xのユーザー名（@マーク除く）',
        url: 'https://x.com/',
      },
      Instagram: {
        username: 'Instagramのユーザーネーム',
        url: 'https://www.instagram.com/',
      },
      TikTok: {
        username: 'TikTokのユーザー名（@マーク除く）',
        url: 'https://www.tiktok.com/@',
      },
      Facebook: {
        username: 'Facebookのユーザー名',
        url: 'https://www.facebook.com/',
      },
      Pinterest: {
        username: 'Pinterestのユーザー名',
        url: 'https://www.pinterest.com/',
      },
      Threads: {
        username: 'Threadsのユーザー名',
        url: 'https://www.threads.net/@',
      },
      note: {
        username: 'noteのユーザー名',
        url: 'https://note.com/',
      },
      BeReal: {
        username: 'BeRealのユーザー名',
        url: 'https://bere.al/',
      },
    }),
    [],
  );
  // URLハッシュを処理する関数
  const checkUrlHash = useCallback(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash.startsWith('#add-sns-')) {
        const platformFromHash = decodeURIComponent(hash.replace('#add-sns-', ''));
        // 大文字小文字を区別せずにチェック
        const matchingPlatform = unusedPlatforms.find(
          (p) => p.toLowerCase() === platformFromHash.toLowerCase(),
        );
        if (matchingPlatform) {
          // 法人共通SNSから該当プラットフォームのURLを取得
          const corporateLink = corporatePlatformUrlsRef.current[matchingPlatform];
          setIsAddingSns(true);
          setIsSelectingSnsType(false);
          setSnsForm({
            platform: matchingPlatform,
            username: corporateLink?.username || '',
            url:
              corporateLink?.url ||
              platformPlaceholders[matchingPlatform as keyof typeof platformPlaceholders]?.url ||
              '',
          });
          // ハッシュをクリア
          setTimeout(() => {
            window.history.replaceState({}, document.title, window.location.pathname);
          }, 100);
        } else {
        }
      }
    }
    // useCallbackの依存配列からcorporatePlatformUrlsを削除（React Hooksのエラー解消）
  }, [unusedPlatforms, platformPlaceholders]);
  // コンポーネントマウント時とハッシュ変更時の処理
  useEffect(() => {
    // 初回マウント時にハッシュをチェック
    checkUrlHash();
    // ハッシュ変更イベントリスナーを追加
    window.addEventListener('hashchange', checkUrlHash);
    return () => {
      window.removeEventListener('hashchange', checkUrlHash);
    };
  }, [checkUrlHash]);
  // プラットフォームの選択処理を修正
  const handleSelectPlatform = (platform: string) => {
    setIsSelectingSnsType(false);
    setIsAddingSns(true);
    // refから法人共通SNSのURLを取得
    const corporateLink = corporatePlatformUrlsRef.current[platform];
    setSnsForm({
      platform,
      username: corporateLink?.username || '',
      url:
        corporateLink?.url ||
        platformPlaceholders[platform as keyof typeof platformPlaceholders]?.url ||
        '',
    });
  };
  // LINE系のプラットフォームかどうか
  const isLineLink = (platform: string) => platform.toLowerCase() === 'line';
  const isOfficialLineLink = (platform: string) => platform.toLowerCase() === '公式line';
  // 入力URLの自動補完機能（既存関数を修正）
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const username = e.target.value;
    setSnsForm((prev) => {
      const platform = prev.platform;
      // LINE系のリンクの場合は特別な処理
      if (isLineLink(platform) || isOfficialLineLink(platform)) {
        return { ...prev, username };
      }
      if (platform && platformPlaceholders[platform as keyof typeof platformPlaceholders]) {
        const baseUrl = platformPlaceholders[platform as keyof typeof platformPlaceholders].url;
        let newUrl = baseUrl;
        if (username) {
          if (username.startsWith('@')) {
            newUrl += username.substring(1); // @を除去
          } else {
            newUrl += username;
          }
        }
        return { ...prev, username, url: newUrl };
      }
      return { ...prev, username };
    });
  };
  // LINE URLの直接編集時の処理を追加
  const handleLineUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setSnsForm((prev) => ({
      ...prev,
      url: newUrl,
    }));
  };
  // SNSリンク追加処理
  const handleAddSns = async () => {
    if (!snsForm.platform || !snsForm.url) {
      toast.error('プラットフォームとURLは必須です');
      return;
    }
    try {
      const response = await fetch('/api/corporate-member/links/sns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(snsForm),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'SNSリンクの追加に失敗しました');
      }
      const data = await response.json();
      // 状態を更新
      onSnsLinkUpdate([...personalSnsLinks, data.snsLink]);
      // フォームをリセット
      setSnsForm({
        platform: '',
        username: '',
        url: '',
      });
      setIsAddingSns(false);
      toast.success('SNSリンクを追加しました');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'SNSリンクの追加に失敗しました');
    }
  };
  // SNSリンク更新処理
  const handleUpdateSns = async (id: string) => {
    if (!snsForm.url) {
      toast.error('URLは必須です');
      return;
    }
    try {
      const response = await fetch(`/api/corporate-member/links/sns/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(snsForm),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'SNSリンクの更新に失敗しました');
      }
      const data = await response.json();
      // 状態を更新
      const updatedLinks = personalSnsLinks.map((link) => (link.id === id ? data.snsLink : link));
      onSnsLinkUpdate(updatedLinks);
      // 編集モードを終了
      setEditingSnsId(null);
      setSnsForm({
        platform: '',
        username: '',
        url: '',
      });
      toast.success('SNSリンクを更新しました');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'SNSリンクの更新に失敗しました');
    }
  };
  // 法人必須SNSリンクかどうかを判定する
  const isRequiredCorporateLink = (platform: string) => {
    return corporatePlatforms.includes(platform);
  };
  // SNSリンク削除処理に条件を追加
  const handleDeleteSns = async (id: string, platform: string) => {
    // 法人必須リンクは削除不可
    if (isRequiredCorporateLink(platform)) {
      toast.error('法人共通の必須SNSリンクは削除できません');
      return;
    }
    // 削除確認
    if (!confirm('このSNSリンクを削除してもよろしいですか？')) {
      return;
    }
    try {
      const response = await fetch(`/api/corporate-member/links/sns/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'SNSリンクの削除に失敗しました');
      }
      // 状態を更新
      const updatedLinks = personalSnsLinks.filter((link) => link.id !== id);
      onSnsLinkUpdate(updatedLinks);
      toast.success('SNSリンクを削除しました');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'SNSリンクの削除に失敗しました');
    }
  };
  // カスタムリンク追加処理
  const handleAddCustom = async () => {
    if (!customForm.name || !customForm.url) {
      toast.error('名前とURLは必須です');
      return;
    }
    try {
      const response = await fetch('/api/corporate-member/links/custom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customForm),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'カスタムリンクの追加に失敗しました');
      }
      const data = await response.json();
      // 状態を更新
      onCustomLinkUpdate([...customLinks, data.customLink]);
      // フォームをリセット
      setCustomForm({
        name: '',
        url: '',
      });
      setIsAddingCustom(false);
      toast.success('カスタムリンクを追加しました');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'カスタムリンクの追加に失敗しました');
    }
  };
  // カスタムリンク更新処理
  const handleUpdateCustom = async (id: string) => {
    if (!customForm.name || !customForm.url) {
      toast.error('名前とURLは必須です');
      return;
    }
    try {
      const response = await fetch(`/api/corporate-member/links/custom/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customForm),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'カスタムリンクの更新に失敗しました');
      }
      const data = await response.json();
      // 状態を更新
      const updatedLinks = customLinks.map((link) => (link.id === id ? data.customLink : link));
      onCustomLinkUpdate(updatedLinks);
      // 編集モードを終了
      setEditingCustomId(null);
      setCustomForm({
        name: '',
        url: '',
      });
      toast.success('カスタムリンクを更新しました');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'カスタムリンクの更新に失敗しました');
    }
  };
  // カスタムリンク削除処理
  const handleDeleteCustom = async (id: string) => {
    // 削除確認
    if (!confirm('このカスタムリンクを削除してもよろしいですか？')) {
      return;
    }
    try {
      const response = await fetch(`/api/corporate-member/links/custom/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'カスタムリンクの削除に失敗しました');
      }
      // 状態を更新
      const updatedLinks = customLinks.filter((link) => link.id !== id);
      onCustomLinkUpdate(updatedLinks);
      toast.success('カスタムリンクを削除しました');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'カスタムリンクの削除に失敗しました');
    }
  };
  // 編集を開始する - SNS
  const startEditingSns = (link: SnsLink) => {
    setEditingSnsId(link.id);
    setSnsForm({
      platform: link.platform,
      username: link.username || '',
      url: link.url,
    });
  };
  // 編集を開始する - カスタム
  const startEditingCustom = (link: CustomLink) => {
    setEditingCustomId(link.id);
    setCustomForm({
      name: link.name,
      url: link.url,
    });
  };
  // プラットフォーム表示名を取得する関数
  const getPlatformDisplayName = (platform: string): string => {
    if (Object.keys(SNS_METADATA).includes(platform)) {
      return SNS_METADATA[platform as SnsPlatform].name;
    }
    return platform;
  };
  // SNSガイドを表示
  const showGuideForPlatform = (platform: string) => {
    // プラットフォーム名を標準化してからガイドを表示
    const normalizedPlatform = normalizeSnsPlatform(platform);
    setGuidePlatform(normalizedPlatform);
    setShowSnsGuide(true);
  };
  // プラットフォーム名を小文字に変換する関数
  const normalizeSnsPlatform = (platform: string): SnsPlatform => {
    // プラットフォーム名の標準化（大文字小文字の違いを吸収）
    const platformLower = platform.toLowerCase();
    if (platformLower === 'line') return 'line';
    if (platformLower === '公式line') return 'official-line';
    if (platformLower === 'youtube') return 'youtube';
    if (platformLower === 'x') return 'x';
    if (platformLower === 'instagram') return 'instagram';
    if (platformLower === 'tiktok') return 'tiktok';
    if (platformLower === 'facebook') return 'facebook';
    if (platformLower === 'pinterest') return 'pinterest';
    if (platformLower === 'threads') return 'threads';
    if (platformLower === 'note') return 'note';
    if (platformLower === 'bereal') return 'bereal';
    // デフォルト値
    return 'line' as SnsPlatform;
  };
  return (
    <div id="member-sns-section" className="space-y-6">
      {/* SNSリンク管理セクション */}
      <div className="rounded-lg border border-[#1E3A8A]/40 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center">
            <HiLink className="mr-2 h-5 w-5 text-gray-600" />
            SNSリンク管理
          </h2>
          <Button
            variant="corporate"
            hoverScale="subtle"
            onClick={() => {
              setIsSelectingSnsType(true);
              setIsAddingSns(false);
            }}
            disabled={isAddingSns || unusedPlatforms.length === 0}
          >
            <HiPlus className="mr-1 h-4 w-4" />
            追加
          </Button>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          プロフィールに表示するSNSアカウントを管理します。
        </p>
        {/* SNSプラットフォーム選択グリッド */}
        {isSelectingSnsType && (
          <div className="border rounded-md p-4 mb-4" style={{ borderColor: `${primaryColor}20` }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">SNSプラットフォームを選択</h3>
              <button
                onClick={() => setIsSelectingSnsType(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <HiX className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
              {unusedPlatforms.map((platform) => (
                <button
                  key={platform}
                  className="flex flex-col items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  style={{ borderColor: '#e2e8f0' }}
                  onClick={() => handleSelectPlatform(platform)}
                >
                  <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mb-2 bg-blue-50">
                    {/* ImprovedSnsIcon を使用 */}
                    <ImprovedSnsIcon
                      platform={normalizeSnsPlatform(platform)}
                      size={24}
                      color="original"
                    />
                  </div>
                  <span className="text-xs sm:text-sm text-center">
                    {getPlatformDisplayName(platform)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
        {/* SNSリンク追加フォーム */}
        {isAddingSns && (
          <div className="border rounded-md p-4 mb-4" style={{ borderColor: '#e2e8f0' }}>
            <div className="space-y-4">
              {/* LINE系とそれ以外で分岐 */}
              {isLineLink(snsForm.platform) || isOfficialLineLink(snsForm.platform) ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isLineLink(snsForm.platform) ? 'LINEのURL' : '公式LINEのURL'}
                  </label>
                  <Input
                    value={snsForm.url}
                    onChange={handleLineUrlChange} // ここで関数を使用
                    placeholder={
                      isLineLink(snsForm.platform)
                        ? 'https://line.me/ti/p/...'
                        : 'https://lin.ee/...'
                    }
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {isLineLink(snsForm.platform)
                      ? 'LINEのURLは自動的に正規化されます'
                      : '公式LINE URLは自動的に正規化されます'}
                  </p>
                </div>
              ) : (
                /* その他のプラットフォーム */
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {platformPlaceholders[snsForm.platform as keyof typeof platformPlaceholders]
                        ?.username || 'ユーザー名'}
                    </label>
                    <Input
                      placeholder={
                        platformPlaceholders[snsForm.platform as keyof typeof platformPlaceholders]
                          ?.username || '@username'
                      }
                      value={snsForm.username}
                      onChange={handleUsernameChange}
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        type="button"
                        className="text-blue-600 text-sm flex items-center hover:underline"
                        onClick={() => showGuideForPlatform(snsForm.platform)}
                      >
                        <HiInformationCircle className="mr-1 h-4 w-4" />
                        {getPlatformDisplayName(snsForm.platform)}の設定ガイドを見る
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                    <Input
                      placeholder="https://..."
                      value={snsForm.url}
                      onChange={(e) => setSnsForm({ ...snsForm, url: e.target.value })}
                    />
                  </div>
                </>
              )}
              <div className="flex justify-end space-x-2 pt-2">
                <Button
                  variant="corporateOutline"
                  hoverScale="subtle"
                  onClick={() => {
                    setIsAddingSns(false);
                    setSnsForm({ platform: '', username: '', url: '' });
                  }}
                >
                  キャンセル
                </Button>
                <Button variant="corporate" hoverScale="subtle" onClick={handleAddSns}>
                  <HiCheck className="mr-1 h-4 w-4" />
                  追加
                </Button>
              </div>
            </div>
          </div>
        )}
        {/* SNSリンクリスト */}
        <div className="space-y-4">
          {personalSnsLinks.map((link) => (
            <div
              key={link.id}
              className="border rounded-md p-4"
              style={{ borderColor: `${primaryColor}20` }}
            >
              {editingSnsId === link.id ? (
                // 編集モード
                <div className="space-y-3">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-md flex items-center justify-center mr-4 bg-blue-50">
                      {/* ImprovedSnsIcon を使用 */}
                      <ImprovedSnsIcon
                        platform={normalizeSnsPlatform(link.platform)}
                        size={24}
                        color="original"
                      />
                    </div>
                    <h3 className="font-medium">{getPlatformDisplayName(link.platform)}</h3>
                  </div>
                  {/* LINE系とそれ以外で分岐 */}
                  {link.platform === 'Line' || link.platform === '公式Line' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {link.platform === 'Line' ? 'LINE URL' : '公式LINE URL'}
                      </label>
                      <Input
                        placeholder={
                          link.platform === 'Line'
                            ? 'https://line.me/ti/p/~...'
                            : 'https://lin.ee/...'
                        }
                        value={snsForm.url}
                        onChange={(e) =>
                          setSnsForm({ ...snsForm, url: e.target.value, username: '' })
                        }
                      />
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {platformPlaceholders[link.platform as keyof typeof platformPlaceholders]
                            ?.username || 'ユーザー名'}
                        </label>
                        <Input
                          placeholder={
                            platformPlaceholders[link.platform as keyof typeof platformPlaceholders]
                              ?.username || '@username'
                          }
                          value={snsForm.username}
                          onChange={handleUsernameChange}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                        <Input
                          placeholder="https://..."
                          value={snsForm.url}
                          onChange={(e) => setSnsForm({ ...snsForm, url: e.target.value })}
                        />
                      </div>
                    </>
                  )}
                  <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-2">
                    <Button
                      variant="corporateOutline"
                      hoverScale="subtle"
                      onClick={() => {
                        setEditingSnsId(null);
                        setSnsForm({ platform: '', username: '', url: '' });
                      }}
                      className="w-full sm:w-auto"
                    >
                      キャンセル
                    </Button>
                    <Button
                      variant="corporate"
                      hoverScale="subtle"
                      onClick={() => handleUpdateSns(link.id)}
                      className="w-full sm:w-auto"
                    >
                      <HiCheck className="mr-1 h-4 w-4" />
                      更新
                    </Button>
                  </div>
                </div>
              ) : (
                // 表示モード部分の完全なコード
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-md flex items-center justify-center mr-4 flex-shrink-0 bg-blue-50">
                    <ImprovedSnsIcon
                      platform={normalizeSnsPlatform(link.platform)}
                      size={24}
                      color="original"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{getPlatformDisplayName(link.platform)}</h3>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline break-all flex items-center"
                    >
                      {link.url}
                      <HiExternalLink className="ml-1 h-3 w-3" />
                    </a>
                    <div className="flex flex-col sm:flex-row items-center mt-3 space-y-2 sm:space-y-0 sm:space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center w-full sm:w-auto"
                        onClick={() => startEditingSns(link)}
                      >
                        <HiPencil className="mr-1 h-3 w-3" />
                        編集
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center text-red-600 border-red-300 w-full sm:w-auto"
                        onClick={() => handleDeleteSns(link.id, link.platform)}
                      >
                        <HiTrash className="mr-1 h-3 w-3" />
                        削除
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      {/* カスタムリンク管理セクション */}
      <div className="rounded-lg border border-[#1E3A8A]/40 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center">
            <HiLink className="mr-2 h-5 w-5 text-gray-600" />
            カスタムリンク管理
          </h2>
          <Button
            variant="corporate"
            hoverScale="subtle"
            onClick={() => setIsAddingCustom(true)}
            disabled={isAddingCustom}
          >
            <HiPlus className="mr-1 h-4 w-4" />
            追加
          </Button>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          SNS以外のカスタムリンクを管理します（ブログ、ポートフォリオなど）。
        </p>
        {/* カスタムリンク追加フォーム */}
        {isAddingCustom && (
          <div className="border rounded-md p-4 mb-4" style={{ borderColor: `${primaryColor}20` }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">新規カスタムリンク追加</h3>
              <button
                onClick={() => {
                  setIsAddingCustom(false);
                  setCustomForm({ name: '', url: '' });
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <HiX className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">表示名</label>
                <Input
                  placeholder="ブログ、ポートフォリオなど"
                  value={customForm.name}
                  onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  リンクの表示名を入力してください（例：ブログ、ポートフォリオ、会社HP）
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                <Input
                  placeholder="https://..."
                  value={customForm.url}
                  onChange={(e) => setCustomForm({ ...customForm, url: e.target.value })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  リンク先のURLを入力してください（必ずhttps://から始めてください）
                </p>
              </div>
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-2">
                <Button
                  variant="corporateOutline"
                  hoverScale="subtle"
                  onClick={() => {
                    setIsAddingCustom(false);
                    setCustomForm({ name: '', url: '' });
                  }}
                  className="w-full sm:w-auto"
                >
                  キャンセル
                </Button>
                <Button
                  variant="corporate"
                  hoverScale="subtle"
                  onClick={handleAddCustom}
                  className="w-full sm:w-auto"
                >
                  <HiCheck className="mr-1 h-4 w-4" />
                  追加
                </Button>
              </div>
            </div>
          </div>
        )}
        {/* カスタムリンクリスト */}
        <div className="space-y-4">
          {customLinks.length === 0 ? (
            <p className="text-gray-500 text-center py-4">カスタムリンクがありません</p>
          ) : (
            customLinks.map((link) => (
              <div
                key={link.id}
                className="border rounded-md p-4"
                style={{ borderColor: `${primaryColor}20` }}
              >
                {editingCustomId === link.id ? (
                  // 編集モード
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">表示名</label>
                      <Input
                        placeholder="ブログ、ポートフォリオなど"
                        value={customForm.name}
                        onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                      <Input
                        placeholder="https://..."
                        value={customForm.url}
                        onChange={(e) => setCustomForm({ ...customForm, url: e.target.value })}
                      />
                    </div>
                    <div className="flex justify-end space-x-2 pt-2">
                      <Button
                        variant="corporateOutline"
                        hoverScale="subtle"
                        onClick={() => {
                          setEditingCustomId(null);
                          setCustomForm({ name: '', url: '' });
                        }}
                      >
                        キャンセル
                      </Button>
                      <Button
                        variant="corporate"
                        hoverScale="subtle"
                        onClick={() => handleUpdateCustom(link.id)}
                      >
                        <HiCheck className="mr-1 h-4 w-4" />
                        更新
                      </Button>
                    </div>
                  </div>
                ) : (
                  // 表示モード
                  <div className="flex items-start">
                    <div className="w-10 h-10 rounded-md flex items-center justify-center mr-4 flex-shrink-0 bg-blue-50">
                      {/* カスタムリンクはHiLinkアイコンを使用 */}
                      <HiLink className="h-5 w-5" style={{ color: primaryColor }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">{link.name}</h3>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline break-all flex items-center"
                      >
                        {link.url}
                        <HiExternalLink className="ml-1 h-3 w-3" />
                      </a>
                      <div className="flex items-center mt-3 space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center"
                          onClick={() => startEditingCustom(link)}
                        >
                          <HiPencil className="mr-1 h-3 w-3" />
                          編集
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center text-red-600 border-red-300 hover:bg-red-600 hover:text-white hover:border-red-600"
                          hoverScale="subtle"
                          onClick={() => handleDeleteCustom(link.id)}
                        >
                          <HiTrash className="mr-1 h-3 w-3" />
                          削除
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      {/* SNSガイドモーダル */}
      {showSnsGuide && guidePlatform && (
        <SnsGuideModalWithDescription
          platform={guidePlatform}
          onClose={() => setShowSnsGuide(false)}
          isOpen={showSnsGuide}
        />
      )}
    </div>
  );
}