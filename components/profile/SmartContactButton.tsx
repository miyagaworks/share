// components/profile/SmartContactButton.tsx
'use client';

import React, { useState, useEffect } from 'react';

interface ContactButtonProps {
  userId: string;
  userName: string;
  userPhone?: string | null; // null も許可
  mainColor: string;
  textColor: string;
}

export default function SmartContactButton({
  userId,
  userName,
  userPhone,
  mainColor,
  textColor,
}: ContactButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'downloading' | 'error'>('idle');
  const [showInstructions, setShowInstructions] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);

  // デバイス検出
  useEffect(() => {
    const detectDevice = () => {
      const ua = navigator.userAgent;
      return {
        isIOS:
          /iPad|iPhone|iPod/.test(ua) ||
          (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
        isAndroid: /Android/.test(ua),
        isSafari: /Safari/.test(ua) && !/Chrome|CriOS/.test(ua),
        isChrome: /Chrome|CriOS/.test(ua) && !/Edge/.test(ua),
        isFirefox: /Firefox|FxiOS/.test(ua),
        isLineApp: /Line/i.test(ua),
        isInstagramApp: /Instagram/i.test(ua),
        isTwitterApp: /Twitter/i.test(ua),
        isFacebookApp: /FB_IAB|FBAN|FBAV/.test(ua),
        isInAppBrowser: /Line|Instagram|FB_IAB|FBAN|FBAV|Twitter/i.test(ua),
        canUseWebShare: 'share' in navigator,
        canShareFiles: 'share' in navigator && 'canShare' in navigator,
      };
    };
    setDeviceInfo(detectDevice());
  }, []);

  // Web Share APIを使った方法（最優先）
  const tryWebShareAPI = async (): Promise<boolean> => {
    if (!deviceInfo?.canUseWebShare) return false;

    try {
      // vCardを取得
      const response = await fetch(`/api/vcard/${userId}`);
      if (!response.ok) {
        console.error('vCard API error:', response.status, await response.text());
        return false;
      }

      const vcardText = await response.text();
      const file = new File([vcardText], `${userName}.vcf`, {
        type: 'text/vcard',
      });

      // ファイル共有可能かチェック
      if (deviceInfo.canShareFiles) {
        try {
          const canShare = await navigator.canShare({ files: [file] });
          if (!canShare) {
            console.log('Cannot share files');
            return false;
          }
        } catch (e) {
          console.log('canShare check failed:', e);
          return false;
        }
      }

      // 共有実行
      await navigator.share({
        files: [file],
        title: `${userName}の連絡先`,
        text: '連絡先を追加',
      });

      setStatus('success');
      return true;
    } catch (error) {
      console.log('Web Share API failed:', error);
      return false;
    }
  };

  // データURLを使った方法（iOS Safari向け）
  const tryDataURL = async (): Promise<boolean> => {
    try {
      const response = await fetch(`/api/vcard/${userId}`);
      if (!response.ok) {
        console.error('vCard API error:', response.status, await response.text());
        return false;
      }

      const vcardText = await response.text();
      const dataUrl = `data:text/vcard;charset=utf-8,${encodeURIComponent(vcardText)}`;

      if (deviceInfo?.isIOS && deviceInfo?.isSafari) {
        // iOS Safariの場合、新しいウィンドウで開く
        window.open(dataUrl, '_blank');
        setStatus('success');
        return true;
      } else {
        // その他のブラウザ
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `${userName}.vcf`;
        link.click();
        setStatus('downloading');
        return true;
      }
    } catch (error) {
      console.log('Data URL method failed:', error);
      return false;
    }
  };

  // Blobダウンロード方法（フォールバック）
  const tryBlobDownload = async (): Promise<boolean> => {
    try {
      const response = await fetch(`/api/vcard/${userId}`);
      if (!response.ok) {
        console.error('vCard API error:', response.status, await response.text());
        return false;
      }

      const vcardText = await response.text();
      const blob = new Blob([vcardText], { type: 'text/vcard;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `${userName}.vcf`;
      link.style.display = 'none';

      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);

      setStatus('downloading');
      return true;
    } catch (error) {
      console.log('Blob download failed:', error);
      return false;
    }
  };

  // Android Intent URL方法（削除 - 動作しないため）
  const tryAndroidIntent = (): boolean => {
    // Android Intentは実際には動作しないケースが多いので無効化
    return false;
  };

  // メイン処理
  const handleAddContact = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    setStatus('idle');

    // デバッグログ
    console.log('Device Info:', deviceInfo);
    console.log('User ID:', userId);

    // アプリ内ブラウザの警告
    if (deviceInfo?.isInAppBrowser) {
      alert('アプリ内ブラウザでは制限があります。SafariやChromeで開くことをおすすめします。');
    }

    // 優先順位に従って試行
    const methods: Array<() => Promise<boolean> | boolean> = [];

    // 1. Web Share API（最優先）
    if (deviceInfo?.canUseWebShare && !deviceInfo?.isInAppBrowser) {
      console.log('Trying Web Share API...');
      methods.push(tryWebShareAPI);
    }

    // 2. iOS Safari用のデータURL
    if (deviceInfo?.isIOS && deviceInfo?.isSafari) {
      console.log('Trying iOS Safari Data URL...');
      methods.push(tryDataURL);
    }

    // 3. Blobダウンロード（全デバイス対応）
    console.log('Adding Blob Download as fallback...');
    methods.push(tryBlobDownload);

    // 順番に試行
    let success = false;
    for (const method of methods) {
      try {
        const result = await method();
        console.log('Method result:', result);
        if (result) {
          success = true;
          break;
        }
      } catch (error) {
        console.error('Method error:', error);
      }
    }

    // すべて失敗した場合
    if (!success) {
      console.error('All methods failed, falling back to direct download');
      setStatus('error');
      // 従来のダウンロード方法にフォールバック
      window.location.href = `/api/vcard/${userId}`;
    }

    // ダウンロードの場合は手順を表示
    if (status === 'downloading') {
      setTimeout(() => {
        setShowInstructions(true);
      }, 500);
    }

    setIsProcessing(false);
  };

  // デバイス別の手順
  const getInstructions = () => {
    if (deviceInfo?.isIOS) {
      return {
        title: 'iPhoneでの連絡先追加',
        steps: [
          'ダウンロードされた.vcfファイルをタップ',
          '「連絡先に追加」または「新規連絡先を作成」をタップ',
          '必要に応じて情報を編集',
          '右上の「完了」をタップ',
        ],
        tip: deviceInfo.isSafari ? null : 'Safariを使うとより簡単に追加できます',
      };
    } else if (deviceInfo?.isAndroid) {
      return {
        title: 'Androidでの連絡先追加',
        steps: [
          'ダウンロード通知をタップ',
          '.vcfファイルを開く',
          '連絡先アプリで「インポート」または「追加」をタップ',
        ],
        tip: '機種により手順が異なる場合があります',
      };
    } else {
      return {
        title: 'パソコンでの連絡先追加',
        steps: ['ダウンロードした.vcfファイルをダブルクリック', 'アドレス帳アプリで「追加」を選択'],
        tip: null,
      };
    }
  };

  return (
    <>
      <button
        onClick={handleAddContact}
        disabled={isProcessing}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          padding: '0.75rem',
          borderRadius: '0.375rem',
          fontWeight: '500',
          color: isProcessing ? '#999' : '#333',
          border: `1px solid ${isProcessing ? '#ccc' : mainColor}`,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          background: isProcessing ? '#f5f5f5' : '#fff',
          cursor: isProcessing ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
          opacity: isProcessing ? 0.7 : 1,
        }}
        className="profile-text"
      >
        {isProcessing ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            処理中...
          </>
        ) : (
          <>
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
          </>
        )}
      </button>

      {/* ステータスメッセージ */}
      {status === 'success' && (
        <div
          style={{
            marginTop: '0.5rem',
            padding: '0.5rem',
            background: '#D1FAE5',
            color: '#065F46',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            textAlign: 'center',
          }}
        >
          ✅ 連絡先を追加できます
        </div>
      )}

      {status === 'downloading' && (
        <div
          style={{
            marginTop: '0.5rem',
            padding: '0.5rem',
            background: '#FEF3C7',
            color: '#92400E',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            textAlign: 'center',
          }}
        >
          📥 ファイルをダウンロードしました
        </div>
      )}

      {/* 手順説明モーダル */}
      {showInstructions && (
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
              maxHeight: '80vh',
              overflowY: 'auto',
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
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>
                {getInstructions().title}
              </h3>
              <button
                onClick={() => setShowInstructions(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: '#999',
                  padding: '0',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ×
              </button>
            </div>

            <ol style={{ paddingLeft: '1.5rem', margin: '0 0 1rem 0' }}>
              {getInstructions().steps.map((step, index) => (
                <li key={index} style={{ marginBottom: '0.5rem' }}>
                  {step}
                </li>
              ))}
            </ol>

            {getInstructions().tip && (
              <div
                style={{
                  marginTop: '1rem',
                  padding: '0.75rem',
                  background: '#F3F4F6',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  color: '#4B5563',
                }}
              >
                💡 {getInstructions().tip}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}