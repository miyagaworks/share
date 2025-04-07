// app/jikogene/lib/constants.tsx
import React from 'react';
import { FormStep } from '../types';
import { HiEmojiHappy, HiLightBulb, HiTag, HiAdjustments } from 'react-icons/hi';

// カスタムユーザーアイコンをSVGで定義
const CustomUserIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20" 
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

// フォームのステップ定義（react-iconsを使用）
export const formSteps: FormStep[] = [
  {
    id: 'basic',
    label: '基本情報',
    icon: <CustomUserIcon />,
  },
  {
    id: 'hobbies',
    label: '趣味・興味',
    icon: <HiEmojiHappy />,
  },
  {
    id: 'personality',
    label: '性格・特性',
    icon: <HiLightBulb />,
  },
  {
    id: 'keywords',
    label: 'キーワード',
    icon: <HiTag />,
  },
  {
    id: 'options',
    label: '出力オプション',
    icon: <HiAdjustments />,
  },
];

// キーワード提案の定義をシンプルに
export const suggestedKeywords = [
  {
    id: 'teamwork',
    name: 'チームワーク',
    icon: '👥',
  },
  {
    id: 'leadership',
    name: 'リーダーシップ',
    icon: '👑',
  },
  {
    id: 'challenge',
    name: '新しい挑戦',
    icon: '🚀',
  },
  {
    id: 'communication',
    name: 'コミュニケーション',
    icon: '💬',
  },
  {
    id: 'growth',
    name: '成長志向',
    icon: '📈',
  },
  {
    id: 'problem-solving',
    name: '問題解決力',
    icon: '🔍',
  },
  {
    id: 'creative',
    name: '創造性',
    icon: '💡',
  },
  {
    id: 'analytical',
    name: '分析力',
    icon: '📊',
  },
  {
    id: 'adaptable',
    name: '適応力',
    icon: '🔄',
  },
  {
    id: 'professional',
    name: 'プロフェッショナル',
    icon: '💼',
  },
  {
    id: 'innovative',
    name: '革新的',
    icon: '🔮',
  },
  {
    id: 'organized',
    name: '計画的',
    icon: '📅',
  },
  {
    id: 'determined',
    name: '粘り強い',
    icon: '💪',
  },
];

// 趣味アイテムの定義をシンプルに - グルメを追加
export const hobbyItems = [
  {
    id: 'reading',
    name: '読書',
    icon: '📚',
  },
  {
    id: 'movie',
    name: '映画鑑賞',
    icon: '🎬',
  },
  {
    id: 'music',
    name: '音楽',
    icon: '🎵',
  },
  {
    id: 'travel',
    name: '旅行',
    icon: '✈️',
  },
  {
    id: 'sports',
    name: 'スポーツ',
    icon: '⚽',
  },
  {
    id: 'cooking',
    name: '料理',
    icon: '🍳',
  },
  {
    id: 'gaming',
    name: 'ゲーム',
    icon: '🎮',
  },
  {
    id: 'programming',
    name: 'プログラミング',
    icon: '💻',
  },
  {
    id: 'art',
    name: 'アート',
    icon: '🎨',
  },
  {
    id: 'photography',
    name: '写真',
    icon: '📷',
  },
  {
    id: 'gardening',
    name: 'ガーデニング',
    icon: '🌱',
  },
  {
    id: 'gourmet',
    name: 'グルメ',
    icon: '🍽️',
  },
];

// 性格特性アイテムの定義をシンプルに
export const personalityItems = [
  {
    id: 'cheerful',
    name: '明るい',
    icon: '😊',
  },
  {
    id: 'serious',
    name: '真面目',
    icon: '🧐',
  },
  {
    id: 'calm',
    name: '穏やか',
    icon: '😌',
  },
  {
    id: 'active',
    name: '積極的',
    icon: '🔥',
  },
  {
    id: 'cool',
    name: '冷静',
    icon: '❄️',
  },
  {
    id: 'careful',
    name: '慎重',
    icon: '⚠️',
  },
  {
    id: 'curious',
    name: '好奇心旺盛',
    icon: '🔎',
  },
  {
    id: 'cooperative',
    name: '協調性がある',
    icon: '🤝',
  },
  {
    id: 'creative',
    name: '創造的',
    icon: '✨',
  },
  {
    id: 'logical',
    name: '論理的',
    icon: '🧮',
  },
  {
    id: 'detail',
    name: '几帳面',
    icon: '📋',
  },
  {
    id: 'kind',
    name: '思いやりがある',
    icon: '❤️',
  },
];
