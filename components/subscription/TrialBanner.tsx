// components/subscription/TrialBanner.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { HiClock, HiArrowRight } from 'react-icons/hi';

interface TrialBannerProps {
    trialEndDate: string | null;
}

export default function TrialBanner({ trialEndDate }: TrialBannerProps) {
    const [daysRemaining, setDaysRemaining] = useState<number>(0);
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        if (trialEndDate) {
            const end = new Date(trialEndDate);
            const now = new Date();
            const diffTime = end.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            setDaysRemaining(diffDays);
        }
    }, [trialEndDate]);

    // 残り日数が0以下またはトライアル期間でない場合は表示しない
    if (!trialEndDate || daysRemaining <= 0 || !visible) return null;

    // プログレスバーの幅を計算
    const progressWidth = `${(100 - (daysRemaining / 7) * 100)}%`;

    return (
        <div
            className="shadow-md rounded-lg"
            style={{
                overflow: 'hidden',
                fontSize: 0,
                lineHeight: 0,
                position: 'relative',
                marginBottom: '1.5rem'
            }}
        >
            <div style={{
                background: 'linear-gradient(to right, rgb(59, 130, 246), rgb(79, 70, 229))',
                color: 'white',
                borderRadius: '0.375rem',
                position: 'relative',
                overflow: 'hidden',
                marginBottom: 0,
            }}>
                {/* モバイル表示 */}
                <div className="sm:hidden" style={{ fontSize: '16px', lineHeight: 'normal' }}>
                    <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center">
                                <div className="bg-white/20 rounded-full p-2 mr-3">
                                    <HiClock className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm">無料トライアル期間中</p>
                                    <p className="text-xs text-white/80">
                                        あと<span className="font-bold mx-1">{daysRemaining}</span>日で終了します
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => setVisible(false)}
                                className="text-white/70 hover:text-white ml-2"
                                aria-label="閉じる"
                            >
                                &times;
                            </button>
                        </div>

                        <Link
                            href="/dashboard/subscription#subscription-plans"
                            className="w-full bg-white text-blue-600 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-blue-50 transition-colors flex items-center justify-center"
                        >
                            プランを選択
                            <HiArrowRight className="ml-1 h-4 w-4" />
                        </Link>
                    </div>
                </div>

                {/* デスクトップ表示 */}
                <div className="hidden sm:flex p-4 items-center justify-between" style={{ fontSize: '16px', lineHeight: 'normal' }}>
                    <div className="flex items-center">
                        <div className="bg-white/20 rounded-full p-2 mr-4">
                            <HiClock className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="font-bold">無料トライアル期間中</p>
                            <p className="text-sm text-white/80">
                                あと<span className="font-bold mx-1">{daysRemaining}</span>日で終了します
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <Link
                            href="/dashboard/subscription#subscription-plans"
                            className="bg-white text-blue-600 px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-50 transition-colors flex items-center"
                        >
                            プランを選択
                            <HiArrowRight className="ml-1 h-4 w-4" />
                        </Link>

                        <button
                            onClick={() => setVisible(false)}
                            className="text-white/70 hover:text-white p-1"
                            aria-label="閉じる"
                        >
                            &times;
                        </button>
                    </div>
                </div>

                {/* プログレスバー - より厳密に制御 */}
                <div
                    style={{
                        display: 'block',
                        width: '100%',
                        height: '1px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        position: 'relative',
                        padding: 0,
                        margin: 0,
                        border: 0,
                        overflow: 'hidden'
                    }}
                >
                    <div
                        style={{
                            display: 'block',
                            width: progressWidth,
                            height: '100%',
                            background: '#ffffff',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            padding: 0,
                            margin: 0,
                            border: 0
                        }}
                    ></div>
                </div>
            </div>

            {/* 余白を埋めるための追加要素 */}
            <div
                style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '100%',
                    height: '2px', // 高さを2pxに増やす
                    background: 'linear-gradient(to right, rgb(59, 130, 246), rgb(79, 70, 229))',
                    zIndex: 0
                }}
            />
        </div>
    );
}