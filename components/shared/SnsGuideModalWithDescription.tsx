'use client';

// components/shared/SnsGuideModalWithDescription.tsx
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { ImprovedSnsIcon } from '@/components/shared/ImprovedSnsIcon';
import { snsGuidesData } from '@/types/sns-guide';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { type SnsPlatform } from '@/types/sns';

interface SnsGuideModalWithDescriptionProps {
    platform: string;
    isOpen: boolean;
    onClose: () => void;
}

export function SnsGuideModalWithDescription({ platform, isOpen, onClose }: SnsGuideModalWithDescriptionProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [understood, setUnderstood] = useState(false);

    const guide = snsGuidesData[platform];

    // モーダルが閉じられたらステートをリセット
    useEffect(() => {
        if (!isOpen) {
            setCurrentStep(0);
            setUnderstood(false);
        }
    }, [isOpen]);

    if (!guide) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto bg-white p-6 rounded-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ImprovedSnsIcon platform={platform as SnsPlatform} size={24} color="primary" />
                        <span>{guide.platformName}のリンク取得方法</span>
                    </DialogTitle>
                    {/* アクセシビリティ警告を修正するためにDescriptionを追加 */}
                    <DialogDescription>
                        このガイドでは{guide.platformName}のアカウント情報を取得する方法を説明します
                    </DialogDescription>
                </DialogHeader>

                {/* ステップインジケーター */}
                <div className="flex justify-center space-x-1 my-4">
                    {guide.steps.map((_, idx) => (
                        <div
                            key={idx}
                            className={`h-2 w-2 rounded-full transition-all ${idx === currentStep ? 'bg-primary w-4' : 'bg-gray-300'}`}
                        />
                    ))}
                </div>

                {/* 現在のステップコンテンツ */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="step-content"
                    >
                        <h3 className="text-lg font-semibold mb-2">{guide.steps[currentStep].title}</h3>
                        <p className="text-sm text-gray-600 mb-4">{guide.steps[currentStep].description}</p>

                        {guide.steps[currentStep].imageUrl && (
                            <div className="relative aspect-square w-full rounded-md overflow-hidden border border-gray-200 mb-4 bg-gray-100">
                                <Image
                                    src={guide.steps[currentStep].imageUrl}
                                    alt={`${guide.platformName}ガイド ステップ${currentStep + 1}`}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 600px"
                                    className="object-contain"
                                />
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* ナビゲーションボタン */}
                <div className="flex justify-between mt-4">
                    <Button
                        variant="outline"
                        onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                        disabled={currentStep === 0}
                    >
                        前へ
                    </Button>

                    {currentStep < guide.steps.length - 1 ? (
                        <Button onClick={() => setCurrentStep(prev => Math.min(guide.steps.length - 1, prev + 1))}>
                            次へ
                        </Button>
                    ) : (
                        <div className="flex items-center gap-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={understood}
                                    onChange={(e) => setUnderstood(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 text-primary"
                                />
                                <span className="text-sm">理解しました</span>
                            </label>
                            <Button onClick={onClose} disabled={!understood}>
                                閉じる
                            </Button>
                        </div>
                    )}
                </div>

                {/* 追加情報 */}
                {guide.additionalInfo && (
                    <div className="mt-6 p-3 bg-blue-50 rounded-md">
                        <p className="text-sm text-blue-800">{guide.additionalInfo}</p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}