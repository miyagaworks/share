// app/qrcode/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Spinner } from '@/components/ui/Spinner';
import { QrCodeGenerator } from '@/components/qrcode/QrCodeGenerator';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import { FaArrowLeft } from 'react-icons/fa';
import { corporateAccessState, checkCorporateAccess } from '@/lib/corporateAccessState';

export default function QrCodePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isCorporateMember, setIsCorporateMember] = useState(false);
  const [corporateData, setCorporateData] = useState<{
    primaryColor: string | null;
    logoUrl: string | null;
    textColor: string | null;
    headerText: string | null;
  } | null>(null);
  const [profileUrl, setProfileUrl] = useState<string>('');
  const [userName, setUserName] = useState<string | null>(null);
  const [nameEn, setNameEn] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [headerText, setHeaderText] = useState<string | null>(null);

  // 法人アクセス権チェック
  useEffect(() => {
    const checkAccess = async () => {
      try {
        await checkCorporateAccess();
        setIsCorporateMember(corporateAccessState.hasAccess === true);
      } catch (err) {
        console.error('法人アクセス権チェックエラー:', err);
      }
    };

    if (session) {
      checkAccess();
    }
  }, [session]);

  // 法人データの取得
  const fetchCorporateData = useCallback(async () => {
    if (!isCorporateMember) return;

    try {
      const response = await fetch('/api/corporate-member/profile');
      if (response.ok) {
        const data = await response.json();

        // 法人テナントデータを設定
        if (data.tenant) {
          setCorporateData({
            primaryColor: data.tenant.primaryColor || '#1E3A8A',
            logoUrl: data.tenant.logoUrl,
            textColor: data.tenant.textColor || '#FFFFFF',
            headerText: data.tenant.headerText || 'シンプルにつながる、スマートにシェア。',
          });
        }

        // ユーザー情報を設定
        if (data.user) {
          if (data.user.name) setUserName(data.user.name);
          if (data.user.nameEn) setNameEn(data.user.nameEn);
          if (data.user.image) setProfileImage(data.user.image);

          // プロフィールがあれば設定
          if (data.user.profile?.slug) {
            const url = `${window.location.origin}/${data.user.profile.slug}`;
            setProfileUrl(url);
          }
        }
      }
    } catch (err) {
      console.error('法人データ取得エラー:', err);
    }
  }, [isCorporateMember]);

  // 一般プロフィールの確認
  const checkProfileExists = useCallback(async () => {
    try {
      const response = await fetch('/api/profile');
      if (response.ok) {
        const data = await response.json();

        if (data.user) {
          // 既存の処理...
          if (data.user.name) setUserName(data.user.name);
          if (data.user.nameEn) setNameEn(data.user.nameEn);
          if (data.user.image) setProfileImage(data.user.image);

          // ヘッダーテキストを設定（追加）
          if (data.user.headerText) {
            setHeaderText(data.user.headerText);
          }

          // その他の情報があれば設定（オプショナル）
          if (data.user.nameEn) setNameEn(data.user.nameEn);
          if (data.user.image) setProfileImage(data.user.image);

          // プロフィールURLがあれば設定
          if (data.user.profile?.slug) {
            const url = `${window.location.origin}/${data.user.profile.slug}`;
            setProfileUrl(url);
          } else {
            // スラグがない場合はデフォルトのURLを設定
            setProfileUrl(`${window.location.origin}/user/${data.user.id}`);
          }

          // headerTextの設定部分も修正が必要
          if (data.user.headerText) {
            // setCorporateDataを含むロジックを修正
            // setCorporateData関数自体を依存配列に入れるべき
            setCorporateData((prevState) => ({
              ...(prevState || {
                primaryColor: '#3B82F6',
                logoUrl: null,
                textColor: '#FFFFFF',
                headerText: 'シンプルにつながる、スマートにシェア。',
              }),
              headerText: data.user.headerText,
            }));
          }
        } else {
          // ユーザー名がない場合のみリダイレクト
          toast.error('ユーザー名が設定されていません。プロフィール設定を完了してください。');
          router.push(
            isCorporateMember ? '/dashboard/corporate-member/profile' : '/dashboard/profile',
          );
          return;
        }
      } else {
        // APIエラー処理
        toast.error('プロフィール情報の取得に失敗しました');
      }
    } catch (error) {
      console.error('Profile check error:', error);
      toast.error('エラーが発生しました。再度お試しください。');
    } finally {
      setIsLoading(false);
    }
    // 修正: corporateDataを依存配列から削除し、setCorporateDataを追加
  }, [router, isCorporateMember, setCorporateData]);

  // 適切な戻り先URLを取得
  const getBackToShareUrl = () => {
    // 法人メンバーの場合は法人メンバー共有設定ページへ
    if (isCorporateMember) {
      return '/dashboard/corporate-member/share';
    }
    // 通常ユーザーの場合は個人共有設定ページへ
    return '/dashboard/share';
  };

  // 初期データ読み込み
  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user) {
      router.push('/auth/signin');
      return;
    }

    // 法人メンバーかどうかで処理を分岐
    if (isCorporateMember) {
      fetchCorporateData().then(() => {
        // 法人データ取得後にプロフィール確認
        checkProfileExists();
      });
    } else {
      // 一般ユーザーの場合はプロフィール確認のみ
      checkProfileExists();
    }
  }, [session, status, router, isCorporateMember, fetchCorporateData, checkProfileExists]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className={`container mx-auto py-8 px-4 ${isCorporateMember ? 'corporate-theme' : ''}`}>
      <div className="mb-6">
        <Link
          href={getBackToShareUrl()}
          className="flex items-center text-blue-600 hover:text-blue-800"
          style={{
            color: isCorporateMember ? corporateData?.primaryColor || '#1E3A8A' : undefined,
          }}
        >
          <FaArrowLeft className="mr-2" />
          共有設定に戻る
        </Link>
      </div>

      <QrCodeGenerator
        corporateBranding={
          isCorporateMember
            ? {
                primaryColor: corporateData?.primaryColor || '#1E3A8A',
                textColor: corporateData?.textColor || '#FFFFFF',
                headerText: corporateData?.headerText || 'シンプルにつながる、スマートにシェア。',
              }
            : undefined
        }
        userProfile={{
          profileUrl,
          userName: userName || '',
          nameEn: nameEn || '',
          profileImage: profileImage || undefined,
          headerText: headerText || 'シンプルにつながる、スマートにシェア。', // ここでheaderTextを使用
        }}
      />
    </div>
  );
}