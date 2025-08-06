// app/dashboard/admin/profile/page.tsx (シンプル版)
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { Spinner } from '@/components/ui/Spinner';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { HiUser, HiShieldCheck, HiExclamationCircle, HiCheckCircle } from 'react-icons/hi';

interface AdminAccess {
  isSuperAdmin: boolean;
  isFinancialAdmin: boolean;
  adminLevel: string;
}

export default function SimpleAdminProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [adminAccess, setAdminAccess] = useState<AdminAccess | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // フォームデータ
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [image, setImage] = useState<string | null>(null);

  // メッセージ表示
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // 管理者権限チェックとプロフィール読み込み
  useEffect(() => {
    const checkAdminAccessAndLoadProfile = async () => {
      if (!session?.user?.id) {
        router.push('/auth/signin');
        return;
      }

      try {
        // 管理者権限チェック（厳密な判定）
        const accessResponse = await fetch('/api/admin/access');

        if (!accessResponse.ok) {
          console.error('管理者権限チェックAPIエラー:', accessResponse.status);
          router.push('/dashboard');
          return;
        }

        const accessData = await accessResponse.json();

        // スーパー管理者または財務管理者のみ許可
        if (!accessData.isSuperAdmin && !accessData.isFinancialAdmin) {
          router.push('/dashboard');
          return;
        }

        setAdminAccess(accessData);

        // プロフィール情報読み込み
        const profileResponse = await fetch('/api/profile');
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setLastName(profileData.user?.lastName || '');
          setFirstName(profileData.user?.firstName || '');
          setImage(profileData.user?.image || null);
        }
      } catch (error) {
        console.error('初期化エラー:', error);
        showMessage('error', '情報の読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccessAndLoadProfile();
  }, [session, router]);

  // プロフィール保存
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!lastName.trim() || !firstName.trim()) {
      showMessage('error', '姓名を両方入力してください');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lastName: lastName.trim(),
          firstName: firstName.trim(),
          image: image || undefined,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        showMessage('success', 'プロフィールを更新しました');
      } else {
        showMessage('error', result.error || 'プロフィールの更新に失敗しました');
      }
    } catch (error) {
      console.error('プロフィール更新エラー:', error);
      showMessage('error', 'プロフィールの更新に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-600">プロフィール情報を読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!adminAccess) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <HiExclamationCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">アクセス権限がありません</h3>
          <p className="text-gray-600">管理者権限が必要です</p>
        </div>
      </div>
    );
  }

  const { isSuperAdmin, isFinancialAdmin } = adminAccess;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      {/* ヘッダー */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <HiUser className="h-8 w-8 text-blue-600 mr-3" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">管理者プロフィール</h1>
            <p className="text-gray-600 mt-1">基本的なプロフィール情報を設定できます</p>
          </div>
        </div>

        {/* 権限バッジ */}
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
            <HiShieldCheck className="h-4 w-4 mr-1" />
            {isSuperAdmin ? 'スーパー管理者' : '財務管理者'}
          </div>
        </div>
      </div>

      {/* メッセージ */}
      {message && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center space-x-2 ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {message.type === 'success' ? (
            <HiCheckCircle className="h-5 w-5" />
          ) : (
            <HiExclamationCircle className="h-5 w-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* プロフィール編集フォーム */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">基本情報</h2>
          <p className="text-sm text-gray-600 mt-1">名前とプロフィール画像を設定できます</p>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6">
          {/* プロフィール画像 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">プロフィール画像</label>
            <div className="flex flex-col items-center space-y-4">
              <ImageUpload value={image} onChange={setImage} disabled={saving} />
              <p className="text-sm text-gray-500 text-center">
                クリックして画像をアップロード（JPG, PNG, 最大1MB）
              </p>
            </div>
          </div>

          {/* 姓名入力 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                姓 <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="山田"
                disabled={saving}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                名 <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="太郎"
                disabled={saving}
                required
              />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-1">システム内で表示される名前です</p>

          {/* プレビュー */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">プレビュー</label>
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              {image ? (
                <Image
                  src={image}
                  alt="プレビュー"
                  width={64}
                  height={64}
                  className="h-16 w-16 rounded-full object-cover mx-auto mb-3 border-2 border-blue-500"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3 border-2 border-blue-500">
                  <HiUser className="h-8 w-8 text-blue-600" />
                </div>
              )}
              <p className="text-lg font-medium text-gray-900">
                {lastName && firstName ? `${lastName} ${firstName}` : '名前未設定'}
              </p>
              <p className="text-sm text-blue-600 mt-1">
                {isSuperAdmin ? 'スーパー管理者' : '財務管理者'}
              </p>
            </div>
          </div>

          {/* 保存ボタン */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={saving}>
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={saving || !lastName.trim() || !firstName.trim()}
              loading={saving}
              loadingText="保存中..."
            >
              プロフィールを保存
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}