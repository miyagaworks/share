// app/jikogene/components/StepIndicator.tsx
'use client';
import { cn } from '@/lib/utils';
import { FormStep } from '../types';
import { memo } from 'react';
interface StepIndicatorProps {
  currentStep: number;
  steps: FormStep[];
}
/**
 * フォームのステップを表示するコンポーネント
 * アイコンを中央に配置し、サイズも最適化
 */
const StepIndicator = memo(function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <div className="mb-8">
      {/* デスクトップ表示 - アイコンを中央配置に修正 */}
      <div className="hidden md:flex justify-center mb-4">
        <div className="flex space-x-12 max-w-full overflow-x-auto py-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center">
              <div
                className={cn(
                  'w-16 h-16 rounded-full flex items-center justify-center transition-colors',
                  index <= currentStep ? 'bg-blue-600' : 'bg-gray-200',
                )}
              >
                {/* アイコンを中央に配置し、適切なサイズに調整 */}
                <div className="flex items-center justify-center w-full h-full">
                  <span
                    className={cn(
                      'text-3xl', // アイコンサイズを適切に調整
                      index <= currentStep ? 'text-white' : 'text-gray-500',
                    )}
                  >
                    {step.icon}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* モバイル表示 - スマホに最適化したサイズでアイコンを中央配置 */}
      <div className="flex md:hidden justify-center mb-4">
        <div className="flex space-x-4 max-w-full overflow-x-auto py-2">
          {steps.map((step, index) => (
            <div key={step.id} className="flex flex-col items-center">
              <div
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
                  index <= currentStep ? 'bg-blue-600' : 'bg-gray-200',
                )}
              >
                {/* アイコンを中央に配置し、適切なサイズに調整 */}
                <div className="flex items-center justify-center w-full h-full">
                  <span
                    className={cn(
                      'text-2xl', // モバイル用にアイコンサイズを調整
                      index <= currentStep ? 'text-white' : 'text-gray-500',
                    )}
                  >
                    {step.icon}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
export default StepIndicator;
