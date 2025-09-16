// components/profile/AndroidFriendlyContactButton.tsx
'use client';

import React, { useState, useEffect } from 'react';

interface ContactButtonProps {
  userId: string;
  userName: string;
  userPhone?: string | null;
  userEmail?: string | null;
  userCompany?: string | null;
  mainColor: string;
  textColor: string;
}

export default function AndroidFriendlyContactButton({
  userId,
  userName,
  userPhone,
  userEmail,
  userCompany,
  mainColor,
  textColor,
}: ContactButtonProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'other'>('other');
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua)) {
      setDeviceType('ios');
    } else if (/Android/.test(ua)) {
      setDeviceType('android');
    }

    // Web Share APIの利用可能性をチェック
    // navigator.shareは関数なので、存在チェックのみ行う
    // 実際のファイル共有可能性はshareVCard内でチェック
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      setCanShare(true);
    }
  }, []);

  // vCardファイルをダウンロード
  const downloadVCard = async () => {
    try {
      const response = await fetch(`/api/vcard/${userId}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `${userName.replace(/[^a-zA-Z0-9]/g, '_')}.vcf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(url), 100);

      // Androidの場合、ダウンロード後の説明を表示
      if (deviceType === 'android') {
        setTimeout(() => {
          alert(
            'ダウンロード完了！\n\n1. 画面上部の通知をタップ\n2. ダウンロードした.vcfファイルをタップ\n3. 「連絡先」アプリで開く\n\nまたは、「ファイル」アプリでダウンロードフォルダを確認してください。',
          );
        }, 500);
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('ダウンロードに失敗しました。もう一度お試しください。');
    }
  };

  // Web Share APIを使用
  const shareVCard = async () => {
    try {
      const response = await fetch(`/api/vcard/${userId}`);
      const blob = await response.blob();
      const file = new File([blob], `${userName}.vcf`, { type: 'text/vcard' });

      // canShareメソッドが存在し、ファイル共有が可能かチェック
      if ('canShare' in navigator && navigator.canShare) {
        const canShareFiles = await navigator.canShare({ files: [file] });
        if (canShareFiles && navigator.share) {
          await navigator.share({
            files: [file],
            title: '連絡先を共有',
          });
          return;
        }
      }

      // Web Share APIが使えない場合はダウンロード
      downloadVCard();
    } catch (error) {
      console.error('Share error:', error);
      downloadVCard();
    }
  };

  return (
    <>
      {/* メインボタン */}
      <button
        onClick={() => setShowOptions(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          padding: '0.75rem',
          borderRadius: '0.375rem',
          fontWeight: '500',
          color: '#333',
          border: `1px solid ${mainColor}`,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          background: '#fff',
          cursor: 'pointer',
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ marginRight: '0.5rem' }}
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <line x1="20" y1="8" x2="20" y2="14" />
          <line x1="23" y1="11" x2="17" y2="11" />
        </svg>
        連絡先に追加
      </button>

      {/* オプション選択モーダル */}
      {showOptions && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '0.5rem',
              padding: '1.5rem',
              maxWidth: '400px',
              width: '100%',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
              }}
            >
              <h3 style={{ margin: 0 }}>連絡先の追加方法を選択</h3>
              <button
                onClick={() => setShowOptions(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#999',
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {/* 方法1: ファイルダウンロード */}
              <button
                onClick={() => {
                  downloadVCard();
                  setShowOptions(false);
                }}
                style={{
                  padding: '1rem',
                  border: '1px solid #e5e5e5',
                  borderRadius: '0.375rem',
                  background: '#fff',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                  📥 ファイルをダウンロード（iPhoneはこちら）
                </div>
                <div style={{ fontSize: '0.875rem', color: '#666' }}>
                  .vcfファイルをダウンロードして連絡先に追加
                </div>
              </button>

              {/* 方法2: 共有メニュー（対応端末のみ） */}
              {canShare && (
                <button
                  onClick={() => {
                    shareVCard();
                    setShowOptions(false);
                  }}
                  style={{
                    padding: '1rem',
                    border: '1px solid #e5e5e5',
                    borderRadius: '0.375rem',
                    background: '#fff',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                    📤 共有メニューから追加
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#666' }}>
                    システムの共有機能を使用
                  </div>
                </button>
              )}
            </div>

            {deviceType === 'android' && (
              <div
                style={{
                  marginTop: '1rem',
                  padding: '0.75rem',
                  background: '#FEF3C7',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                }}
              >
                💡 ヒント:
                ダウンロード後、通知バーまたは「ファイル」アプリでダウンロードフォルダを確認してください
              </div>
            )}
          </div>
        </div>
      )}

      {/* 手動追加用の情報表示は削除 */}
    </>
  );
}