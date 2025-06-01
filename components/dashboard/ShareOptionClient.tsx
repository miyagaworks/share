// components/dashboard/ShareOptionClient.tsx
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { FaLink, FaFacebook, FaLine } from 'react-icons/fa';
import { RiTwitterXFill } from 'react-icons/ri';
import { HiMail } from 'react-icons/hi';
interface ShareOptionClientProps {
  profileUrl: string;
}
export function ShareOptionClient({ profileUrl }: ShareOptionClientProps) {
  const [isCopied, setIsCopied] = useState(false);
  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setIsCopied(true);
      toast.success('URLをコピーしました');
      // 2秒後にコピー状態をリセット
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch {
      toast.error('URLのコピーに失敗しました');
    }
  };
  const handleShare = (platform: string) => {
    let shareUrl = '';
    const text = '私のプロフィールをチェックしてください！';
    switch (platform) {
      case 'line':
        shareUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(profileUrl)}`;
        break;
      case 'x':
        shareUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(profileUrl)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`;
        break;
      case 'mail':
        shareUrl = `mailto:?subject=${encodeURIComponent('プロフィール共有')}&body=${encodeURIComponent(`${text}\n${profileUrl}`)}`;
        break;
      default:
        return;
    }
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };
  return (
    <div className="space-y-4">
      <Button
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-800 text-white"
        onClick={handleCopyUrl}
      >
        <FaLink className="h-4 w-4" />
        {isCopied ? 'コピーしました！' : 'URLをコピー'}
      </Button>
      <div className="grid grid-cols-4 gap-2">
        <Button variant="outline" className="p-2 h-auto" onClick={() => handleShare('line')}>
          <FaLine className="h-5 w-5" />
          <span className="sr-only">LINEで共有</span>
        </Button>
        <Button variant="outline" className="p-2 h-auto" onClick={() => handleShare('x')}>
          <RiTwitterXFill className="h-5 w-5" />
          <span className="sr-only">Xで共有</span>
        </Button>
        <Button variant="outline" className="p-2 h-auto" onClick={() => handleShare('facebook')}>
          <FaFacebook className="h-5 w-5" />
          <span className="sr-only">Facebookで共有</span>
        </Button>
        <Button variant="outline" className="p-2 h-auto" onClick={() => handleShare('mail')}>
          <HiMail className="h-5 w-5" />
          <span className="sr-only">メールで共有</span>
        </Button>
      </div>
    </div>
  );
}
