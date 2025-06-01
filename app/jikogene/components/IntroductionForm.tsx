// app/jikogene/components/IntroductionForm.tsx
'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import StepIndicator from './StepIndicator';
import BasicInfo from './FormSteps/BasicInfo';
import Hobbies from './FormSteps/Hobbies';
import Personality from './FormSteps/Personality';
import Keywords from './FormSteps/Keywords';
import OutputOptions from './FormSteps/OutputOptions';
import { Button } from '@/components/ui/Button';
import { formSteps } from '../lib/constants';
import { FormData } from '../types';
import { useIntroductionForm } from '../hooks/useIntroductionForm';
import { memo } from 'react';
import { toast } from 'react-hot-toast';
interface IntroductionFormProps {
  onSubmit: (data: FormData) => void;
  initialUserInfo?: {
    name?: string;
    nameEn?: string;
    occupation?: string;
    phone?: string;
    currentBio?: string;
  };
}
/**
 * 自己紹介フォームメインコンポーネント
 */
const IntroductionForm = memo(function IntroductionForm({
  onSubmit,
}: IntroductionFormProps) {
  // ステップ状態管理
  const [currentStep, setCurrentStep] = useState(0);
  const { formData, fieldErrors, updateBasicInfo, updateFormData, isStepValid } =
    useIntroductionForm();
  // formRef を使用してフォーム要素にアクセス
  const formRef = useRef<HTMLFormElement>(null);
  // 現在のステップの検証状態
  const [isCurrentStepValid, setIsCurrentStepValid] = useState(false);
  // 送信中の状態
  const [isSubmitting, setIsSubmitting] = useState(false);
  // コンポーネントのマウント時に実行するロジック
  useEffect(() => {
    // ステップの検証状態を初期化
    const valid = isStepValid(currentStep);
    setIsCurrentStepValid(valid);
  }, [currentStep, isStepValid]);
  // 現在のステップの検証状態を更新
  useEffect(() => {
    const valid = isStepValid(currentStep);
    setIsCurrentStepValid(valid);
  }, [currentStep, formData, isStepValid]);
  // 次のステップへ進む - 厳格な制御を追加
  const nextStep = useCallback(
    (e?: React.MouseEvent) => {
      // イベントがある場合は、デフォルトの送信動作を明示的に防止
      if (e) {
        e.preventDefault();
      }
      // ステップの上限をチェック
      if (currentStep >= formSteps.length - 1) {
        return;
      }
      // 現在のステップの検証
      const valid = isStepValid(currentStep);
      if (!valid) {
        toast.error('必須項目を入力してください');
        return;
      }
      // 次のステップに進む
      const nextStepIndex = currentStep + 1;
      setCurrentStep(nextStepIndex);
      window.scrollTo(0, 0);
    },
    [currentStep, isStepValid],
  );
  // 前のステップに戻る
  const prevStep = useCallback(
    (e?: React.MouseEvent) => {
      // イベントがある場合は、デフォルトの送信動作を明示的に防止
      if (e) {
        e.preventDefault();
      }
      if (currentStep <= 0) {
        return;
      }
      const prevStepIndex = currentStep - 1;
      setCurrentStep(prevStepIndex);
      window.scrollTo(0, 0);
    },
    [currentStep],
  );
  // フォーム送信 - 最後のステップでのみ発生させる
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      // 送信中の場合は処理を行わない
      if (isSubmitting) {
        return;
      }
      // 最後のステップであることを確認
      if (currentStep === formSteps.length - 1) {
        // 最終ステップの検証
        if (!isStepValid(currentStep)) {
          toast.error('出力オプションの必須項目を入力してください');
          return;
        }
        // すべてのステップが有効かどうかを確認
        for (let i = 0; i < formSteps.length; i++) {
          if (!isStepValid(i)) {
            toast.error(`ステップ ${i + 1} に未入力の必須項目があります`);
            // 問題のあるステップに移動
            setCurrentStep(i);
            return;
          }
        }
        try {
          setIsSubmitting(true);
          await onSubmit(formData);
        } catch (error) {
          toast.error('送信中にエラーが発生しました');
        } finally {
          setIsSubmitting(false);
        }
      } else {
        // 最終ステップでなければ次へ進む
        nextStep();
      }
    },
    [currentStep, formData, isStepValid, isSubmitting, nextStep, onSubmit],
  );
  // 各ステップの見出しとアイコン
  const stepHeaders = [
    { title: '基本情報', icon: formSteps[0].icon },
    { title: '趣味・興味', icon: formSteps[1].icon },
    { title: '性格・特性', icon: formSteps[2].icon },
    { title: 'キーワード', icon: formSteps[3].icon },
    { title: '出力オプション', icon: formSteps[4].icon },
  ];
  // 現在のステップコンポーネントをレンダリング
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <BasicInfo
            formData={formData}
            updateBasicInfo={updateBasicInfo}
            sectionIcon={formSteps[0].icon}
            fieldErrors={fieldErrors}
          />
        );
      case 1:
        return (
          <Hobbies
            formData={formData}
            updateFormData={updateFormData}
            sectionIcon={formSteps[1].icon}
            fieldErrors={fieldErrors}
          />
        );
      case 2:
        return (
          <Personality
            formData={formData}
            updateFormData={updateFormData}
            sectionIcon={formSteps[2].icon}
            fieldErrors={fieldErrors}
          />
        );
      case 3:
        return (
          <Keywords
            formData={formData}
            updateFormData={updateFormData}
            sectionIcon={formSteps[3].icon}
            fieldErrors={fieldErrors}
          />
        );
      case 4:
        return (
          <OutputOptions
            formData={formData}
            updateFormData={updateFormData}
            sectionIcon={formSteps[4].icon}
            fieldErrors={fieldErrors}
          />
        );
      default:
        return <div>不明なステップです</div>;
    }
  };
  // 「次へ」と「送信」ボタンのレンダリング
  const renderNextOrSubmitButton = () => {
    const isLastStep = currentStep === formSteps.length - 1;
    if (isLastStep) {
      return (
        <Button
          type="submit"
          variant="default"
          disabled={isSubmitting || !isCurrentStepValid}
          className="flex items-center"
        >
          {isSubmitting ? '生成中...' : '自己紹介を生成'}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 ml-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        </Button>
      );
    }
    return (
      <Button
        type="button" // 最終ステップでない場合は明示的にtypeをbuttonに設定
        variant="default"
        onClick={nextStep}
        disabled={!isCurrentStepValid}
        className="flex items-center"
      >
        次へ
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 ml-2"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </Button>
    );
  };
  return (
    <div className="max-w-3xl mx-auto">
      {/* ステップインジケーター */}
      <StepIndicator currentStep={currentStep} steps={formSteps} />
      <form onSubmit={handleSubmit} ref={formRef}>
        {/* 現在のステップのタイトルとアイコンを表示 */}
        <div className="mb-6">
          <h2 className="text-xl font-bold flex items-center">
            <span className="text-gray-500 mr-3 text-2xl">{stepHeaders[currentStep].icon}</span>
            {stepHeaders[currentStep].title}
          </h2>
        </div>
        {/* 現在のステップコンポーネント */}
        {renderCurrentStep()}
        {/* ナビゲーションボタン */}
        <div className="flex justify-between mt-8">
          <Button
            type="button" // 明示的にtypeをbuttonに設定して、フォーム送信を防止
            variant="secondary"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            前へ
          </Button>
          {renderNextOrSubmitButton()}
        </div>
      </form>
      {/* ステップ数表示 */}
      <div className="mt-6 text-center text-gray-500 text-sm">
        ステップ {currentStep + 1} / {formSteps.length}
      </div>
    </div>
  );
});
export default IntroductionForm;