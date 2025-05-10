// components/shared/ImprovedSnsIcon.tsx
'use client';

import React from 'react';
import { FaYoutube, FaInstagram, FaTiktok, FaFacebook, FaPinterest } from 'react-icons/fa';
import { SiThreads } from 'react-icons/si';
import { RiTwitterXFill } from 'react-icons/ri';
import { type SnsPlatform } from '@/types/sns';

interface ImprovedSnsIconProps {
  platform: SnsPlatform;
  size?: number;
  color?: 'primary' | 'white' | 'default' | 'original' | string;
  className?: string;
}

// SNS別の元のカラー
const SNS_COLORS: Record<string, string> = {
  line: '#06C755',
  'official-line': '#06C755',
  youtube: '#FF0000',
  x: '#000000',
  instagram: '#E4405F',
  tiktok: '#000000',
  facebook: '#1877F2',
  pinterest: '#BD081C',
  threads: '#000000',
  note: '#000000',
  bereal: '#000000',
};

// LINEのSVGパス
const LINE_SVG_PATH =
  'M98.54,43.41c0-21.81-21.86-39.55-48.74-39.55S1.06,21.6,1.06,43.41c0,19.55,17.34,35.93,40.76,39.02,1.59.34,3.75,1.05,4.29,2.4.49,1.23.32,3.16.16,4.41,0,0-.57,3.44-.7,4.17-.21,1.23-.98,4.82,4.22,2.63s28.07-16.53,38.3-28.3h0c7.06-7.75,10.45-15.61,10.45-24.34h0ZM32.61,55.07c0,.51-.42.93-.93.93h-13.69c-.51,0-.93-.42-.93-.93h0v-21.27c0-.51.42-.93.93-.93h3.46c.51,0,.93.42.93.93v16.88h9.31c.51,0,.93.42.93.93v3.46h-.01ZM40.85,55.07c0,.51-.42.93-.93.93h-3.46c-.51,0-.93-.42-.93-.93v-21.27c0-.51.42-.93.93-.93h3.46c.51,0,.93.42.93.93v21.27ZM64.38,55.07c0,.51-.42.93-.93.93h-3.44c-.08,0-.17,0-.24-.03h0s-.04,0-.06-.02c0,0-.02,0-.03,0-.02,0-.03,0-.05-.02-.02,0-.03,0-.04-.02,0,0-.02,0-.03,0-.02,0-.04-.02-.06-.04h0c-.09-.06-.17-.14-.24-.23l-9.74-13.16v12.63c0,.51-.42.93-.93.93h-3.46c-.51,0-.93-.42-.93-.93v-21.27c0-.51.42-.93.93-.93h3.61s.04,0,.06,0h.03s.04,0,.06.02c0,0,.02,0,.03,0c.02,0,.04.02.05.02s.02,0,.03,0c.02,0,.03.02.05.03,0,0,.02,0,.03.02.02,0,.03.02.05.03,0,0,.02,0,.03.02.02,0,.03.03.05.04l.02.02.06.06h0s.05.06.07.1l9.73,13.14v-12.63c0-.51.42-.93.93-.93h3.46c.51,0,.93.42.93.93v21.27h0ZM83.26,37.26c0,.51-.42.93-.93.93h-9.31v3.59h9.31c.51,0,.93.42.93.93v3.46c0,.51-.42.93-.93.93h-9.31v3.59h9.31c.51,0,.93.42.93.93v3.46c0,.51-.42.93-.93.93h-13.69c-.51,0-.93-.42-.93-.93h0v-21.25h0v-.02c0-.51.42-.93.93-.93h13.69c.51,0,.93.42.93.93v3.46h0Z';

// noteのSVGパス
const NOTE_SVG_PATH =
  'M11.05,11.94c15,0,35.55-.76,50.3-.36,19.78.51,27.24,9.14,27.5,30.41.25,12.05,0,46.51,0,46.51h-21.41c0-30.16.11-35.15,0-44.65-.25-8.38-2.62-12.35-9.07-13.11-6.81-.76-25.89-.11-25.89-.11v57.91H11.05V11.94Z';

// BeRealのSVGパス
const BEREAL_SVG_PATH =
  'M88.5,60.7h4.6v-21.8h-4.6v21.8ZM71.3,56.3h0c0-2.8,2.3-4.5,6.3-4.7l4-.2v-1c0-1.4-.9-2.2-2.7-2.2s-2.7.7-2.9,1.7h0c0,.1-4,.1-4,.1v-.2c.3-2.9,2.8-4.9,7.1-4.9s6.9,2.1,6.9,5.2v10.6h-4.4v-2.3h0c-.9,1.6-2.7,2.6-4.8,2.6-3.3,0-5.5-1.9-5.5-4.7ZM78.2,57.9c2,0,3.4-1.2,3.4-2.8v-1.1l-3.3.2c-1.7.1-2.6.8-2.6,1.9h0c0,1.2,1,1.8,2.5,1.8ZM63.3,61.1c-2.8,0-5.1-.7-6.7-2.2-1.6-1.5-2.4-3.4-2.4-5.9s.7-4.5,2.2-6c1.5-1.5,3.5-2.2,6-2.2s4.4.8,5.6,2.4c1.2,1.6,1.8,3.5,1.8,5.7v1.3h-11c.2,1,.7,1.8,1.5,2.4.8.6,1.8.9,3.1.9s1.4,0,2-.3c.6-.2,1.3-.4,2.1-.8l1.3,3c-.8.6-1.7,1-2.8,1.2-1.1.3-2,.4-2.7.4ZM65.7,51.4c-.2-1-.6-1.8-1.2-2.3-.6-.5-1.3-.8-2.2-.8s-1.6.3-2.3.8c-.6.5-1,1.3-1.2,2.3h6.8ZM50.1,60.7l-4.8-8.3c-.2,0-.5,0-.8,0-.3,0-.5,0-.8,0h-2.5v8.3h-4.3v-21.8h7.2c2.5,0,4.6.5,6.4,1.6,1.8,1.1,2.7,2.8,2.7,5.1s-.4,2.5-1.1,3.5c-.7,1-1.7,1.7-2.8,2.3l5.6,9.3h-4.6ZM43.9,42.4h-2.7v6.7h2.8c1.3,0,2.4-.3,3.2-.8.9-.5,1.3-1.3,1.3-2.5s-.4-2.1-1.2-2.6c-.8-.5-1.9-.8-3.4-.8ZM28.3,61.1c-2.8,0-5.1-.7-6.7-2.2-1.6-1.5-2.4-3.4-2.4-5.9s.7-4.5,2.2-6c1.5-1.5,3.5-2.2,6-2.2s4.4.8,5.6,2.4c1.2,1.6,1.8,3.5,1.8,5.7v1.3h-11c.2,1,.7,1.8,1.5,2.4.8.6,1.8.9,3.1.9s1.4,0,2-.3c.6-.2,1.3-.4,2.1-.8l1.3,3c-.8.6-1.7,1-2.8,1.2-1.1.3-2,.4-2.7.4ZM30.7,51.4c-.2-1-.6-1.8-1.2-2.3-.6-.5-1.3-.8-2.2-.8s-1.6.3-2.3.8c-.6.5-1,1.3-1.2,2.3h6.8ZM8.5,38.9c2.2,0,4,.5,5.4,1.4,1.4.9,2.1,2.5,2.1,4.7s-.2,1.5-.6,2.2c-.4.7-.9,1.2-1.5,1.7,1,.5,1.9,1.2,2.5,2.1.7.9,1,2,1,3.3,0,2-.7,3.6-2.2,4.7-1.5,1.1-3.4,1.7-5.9,1.7H0v-21.8h8.5ZM7.9,42.4h-3.6v5.4h3.2c1.2,0,2.2-.2,2.8-.7.7-.4,1-1.1,1-2.1s-.3-1.7-.9-2.1c-.6-.4-1.5-.6-2.6-.6ZM9.4,51.2h-5v6.1h4.7c1.2,0,2.1-.3,2.8-.8.7-.5,1.1-1.2,1.1-2.2s-.3-1.8-1-2.4c-.7-.5-1.5-.8-2.6-.8ZM95.5,60.7h4.5v-4.3h-4.5v4.3Z';

export function ImprovedSnsIcon({
  platform,
  size = 24,
  color = 'default',
  className = '',
}: ImprovedSnsIconProps) {
  // カラーの決定
  let finalColor = '';

  if (color === 'primary') {
    finalColor = 'var(--primary)';
  } else if (color === 'white') {
    finalColor = 'white';
  } else if (color === 'default') {
    finalColor = 'currentColor';
  } else if (color === 'original') {
    // 元々のアイコンカラーを使用
    finalColor = SNS_COLORS[platform] || '#333333';
  } else if (color === 'corporate-primary') {
    // 法人カラーを適用
    finalColor = 'var(--color-corporate-primary)';
  } else {
    // 指定された色を使用
    finalColor = color;
  }

  // スタイルの設定
  const style = {
    color: finalColor,
    width: size,
    height: size,
    display: 'inline-block',
  };

  // カスタムSVGアイコン（iOS互換性向上のため簡素化）
  const renderCustomSvg = (path: string) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      style={style}
      className={className}
    >
      <path fill={finalColor} d={path} />
    </svg>
  );

  // プラットフォーム別のアイコン表示
  switch (
    platform.toLowerCase() // 小文字に変換して比較
  ) {
    case 'line':
    case 'Line':
    case 'LINE':
      return renderCustomSvg(LINE_SVG_PATH);
    case 'official-line':
    case 'officialline':
    case '公式line':
    case '公式LINE':
      return renderCustomSvg(LINE_SVG_PATH);
    case 'youtube':
    case 'YouTube':
    case 'YOUTUBE':
      return <FaYoutube style={style} className={className} />;
    case 'x':
    case 'X':
    case 'twitter':
    case 'Twitter':
    case 'TWITTER':
      return <RiTwitterXFill style={style} className={className} />;
    case 'instagram':
    case 'Instagram':
    case 'INSTAGRAM':
      return <FaInstagram style={style} className={className} />;
    case 'tiktok':
    case 'TikTok':
    case 'TIKTOK':
      return <FaTiktok style={style} className={className} />;
    case 'facebook':
    case 'Facebook':
    case 'FACEBOOK':
      return <FaFacebook style={style} className={className} />;
    case 'pinterest':
    case 'Pinterest':
    case 'PINTEREST':
      return <FaPinterest style={style} className={className} />;
    case 'threads':
    case 'Threads':
    case 'THREADS':
      return <SiThreads style={style} className={className} />;
    case 'note':
    case 'Note':
    case 'NOTE':
      return renderCustomSvg(NOTE_SVG_PATH);
    case 'bereal':
    case 'BeReal':
    case 'BEREAL':
      return renderCustomSvg(BEREAL_SVG_PATH);
    default:
      console.log(`未知のプラットフォーム: ${platform}`);
      return null;
  }
}