'use client';

import { useState, useRef, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, Clock, PhoneOff, Mail } from 'lucide-react';
import { submitPartnerInquiry } from '../actions/submitPartnerInquiry';
import { PartnerEvents } from '../utils/analytics';

const schema = z.object({
  companyName: z
    .string()
    .min(1, '会社名を入力してください')
    .max(100, '100文字以内で入力してください'),
  name: z
    .string()
    .min(1, 'お名前を入力してください')
    .max(50, '50文字以内で入力してください'),
  email: z
    .string()
    .min(1, 'メールアドレスを入力してください')
    .email('正しいメールアドレスを入力してください'),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^[0-9\-+()\s]*$/.test(val),
      '正しい電話番号を入力してください',
    ),
  preferences: z
    .array(z.string())
    .min(1, 'ご希望を1つ以上選択してください'),
  consultationDate1: z.string().optional(),
  consultationDate2: z.string().optional(),
  consultationDate3: z.string().optional(),
  question: z.string().max(1000, '1000文字以内で入力してください').optional(),
});

type FormData = z.infer<typeof schema>;

const preferenceOptions = [
  '資料をダウンロードしたい',
  'オンライン相談を希望（30分・無料）',
  'まずは質問だけしたい',
];

const inputClass =
  'w-full rounded-lg border border-[#D5D2CC] px-4 py-3 text-sm text-[#2D3748] lg:text-base outline-none transition-colors focus:border-[#4A6FA5] focus:ring-2 focus:ring-[#4A6FA5]/20';

const expandVariants = {
  hidden: { opacity: 0, height: 0, marginTop: 0 },
  visible: { opacity: 1, height: 'auto', marginTop: 12 },
};

export default function PartnerForm() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const formStarted = useRef(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      companyName: '',
      name: '',
      email: '',
      phone: '',
      preferences: [],
      consultationDate1: '',
      consultationDate2: '',
      consultationDate3: '',
      question: '',
    },
  });

  useEffect(() => {
    const handler = (e: Event) => {
      const preference = (e as CustomEvent<string>).detail;
      const current = getValues('preferences');
      if (!current.includes(preference)) {
        setValue('preferences', [...current, preference], { shouldValidate: true });
      }
    };
    window.addEventListener('partner-preference', handler);
    return () => window.removeEventListener('partner-preference', handler);
  }, [setValue, getValues]);

  const preferences = useWatch({ control, name: 'preferences' });
  const showConsultation = preferences?.includes('オンライン相談を希望（30分・無料）');
  const showQuestion = preferences?.includes('まずは質問だけしたい');

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    const fd = new FormData();
    fd.set('companyName', data.companyName);
    fd.set('name', data.name);
    fd.set('email', data.email);
    if (data.phone) fd.set('phone', data.phone);
    data.preferences.forEach((p) => fd.append('preferences', p));
    if (data.consultationDate1) fd.set('consultationDate1', data.consultationDate1);
    if (data.consultationDate2) fd.set('consultationDate2', data.consultationDate2);
    if (data.consultationDate3) fd.set('consultationDate3', data.consultationDate3);
    if (data.question) fd.set('question', data.question);

    const result = await submitPartnerInquiry(fd);

    if (result.success) {
      setSubmitted(true);
      PartnerEvents.formSubmit(data.preferences);
      // 成功メッセージが見えるようにスクロール
      setTimeout(() => {
        document.getElementById('cta')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } else {
      setServerError('送信に失敗しました。もう一度お試しください。');
    }
  };

  const handleFormFocus = () => {
    if (!formStarted.current) {
      formStarted.current = true;
      PartnerEvents.formStart();
    }
  };

  const handleInvalid = () => {
    Object.keys(errors).forEach((field) => {
      PartnerEvents.formError(field);
    });
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="rounded-xl border border-[#2D8659]/20 bg-[#2D8659]/5 p-8 text-center"
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#2D8659]">
          <Check className="h-7 w-7 text-white" strokeWidth={3} />
        </div>
        <h3 className="mb-2 text-xl font-bold text-[#2D3748]">
          ありがとうございます。
        </h3>
        <p className="text-[#5A6577]">
          資料をメールでお送りしました。
          <br />
          ご確認をお願いいたします。
        </p>
      </motion.div>
    );
  }

  // 明日以降の日付をmin値として設定
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().slice(0, 16);

  return (
    <form onSubmit={handleSubmit(onSubmit, handleInvalid)} onFocus={handleFormFocus} className="space-y-5">
      {/* 会社名 */}
      <div>
        <label htmlFor="companyName" className="mb-1.5 block text-sm font-medium text-[#2D3748] lg:text-base">
          会社名 <span className="text-[#9B4D3A]">*</span>
        </label>
        <input id="companyName" type="text" {...register('companyName')} className={inputClass} placeholder="例：株式会社○○印刷" />
        {errors.companyName && <p className="mt-1 text-xs text-[#9B4D3A] lg:text-sm">{errors.companyName.message}</p>}
      </div>

      {/* お名前 */}
      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-[#2D3748] lg:text-base">
          お名前 <span className="text-[#9B4D3A]">*</span>
        </label>
        <input id="name" type="text" {...register('name')} className={inputClass} placeholder="例：田中 太郎" />
        {errors.name && <p className="mt-1 text-xs text-[#9B4D3A] lg:text-sm">{errors.name.message}</p>}
      </div>

      {/* メールアドレス */}
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-[#2D3748] lg:text-base">
          メールアドレス <span className="text-[#9B4D3A]">*</span>
        </label>
        <input id="email" type="email" {...register('email')} className={inputClass} placeholder="例：tanaka@example.com" />
        {errors.email && <p className="mt-1 text-xs text-[#9B4D3A] lg:text-sm">{errors.email.message}</p>}
      </div>

      {/* 電話番号 */}
      <div>
        <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-[#2D3748] lg:text-base">
          電話番号 <span className="text-xs text-[#5A6577] lg:text-sm">（任意）</span>
        </label>
        <input id="phone" type="tel" {...register('phone')} className={inputClass} placeholder="例：03-1234-5678" />
        {errors.phone && <p className="mt-1 text-xs text-[#9B4D3A] lg:text-sm">{errors.phone.message}</p>}
      </div>

      {/* ご希望 */}
      <div>
        <p className="mb-2 text-sm font-medium text-[#2D3748] lg:text-base">
          ご希望（複数選択可） <span className="text-[#9B4D3A]">*</span>
        </p>
        <div className="space-y-2">
          {preferenceOptions.map((opt) => (
            <div key={opt}>
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#D5D2CC] px-4 py-3 transition-colors hover:bg-[#FAFAF8]">
                <input
                  type="checkbox"
                  value={opt}
                  {...register('preferences')}
                  className="h-4 w-4 rounded border-[#D5D2CC] text-[#4A6FA5] focus:ring-[#4A6FA5]"
                />
                <span className="text-sm text-[#2D3748] lg:text-base">{opt}</span>
              </label>

              {/* オンライン相談：日時候補 */}
              {opt === 'オンライン相談を希望（30分・無料）' && (
                <AnimatePresence>
                  {showConsultation && (
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      variants={expandVariants}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden rounded-lg border border-[#E8E6E1] bg-[#FAFAF8] p-4"
                    >
                      <p className="mb-3 text-xs font-medium text-[#5A6577] lg:text-sm">
                        ご希望の日時を選択してください（第3候補まで）
                      </p>
                      <div className="space-y-3">
                        {(['consultationDate1', 'consultationDate2', 'consultationDate3'] as const).map((field, i) => (
                          <div key={field}>
                            <label htmlFor={field} className="mb-1 block text-xs text-[#5A6577]">
                              第{i + 1}候補{i === 0 && ' *'}
                            </label>
                            <input
                              id={field}
                              type="datetime-local"
                              min={minDate}
                              {...register(field)}
                              className={inputClass}
                            />
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}

              {/* 質問：テキストエリア */}
              {opt === 'まずは質問だけしたい' && (
                <AnimatePresence>
                  {showQuestion && (
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      variants={expandVariants}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden rounded-lg border border-[#E8E6E1] bg-[#FAFAF8] p-4"
                    >
                      <label htmlFor="question" className="mb-2 block text-xs font-medium text-[#5A6577] lg:text-sm">
                        ご質問内容をお書きください
                      </label>
                      <textarea
                        id="question"
                        rows={4}
                        {...register('question')}
                        className={`${inputClass} resize-none`}
                        placeholder="気になること、確認したいことなど自由にご記入ください"
                      />
                      {errors.question && <p className="mt-1 text-xs text-[#9B4D3A]">{errors.question.message}</p>}
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </div>
          ))}
        </div>
        {errors.preferences && (
          <p className="mt-1 text-xs text-[#9B4D3A] lg:text-sm">{errors.preferences.message}</p>
        )}
      </div>

      {serverError && (
        <p className="text-center text-sm text-[#9B4D3A]">{serverError}</p>
      )}

      {/* 送信ボタン */}
      <motion.button
        type="submit"
        disabled={isSubmitting}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#B8860B] px-6 py-4 text-lg font-bold text-white shadow-md lg:text-xl transition-colors hover:bg-[#A0750A] disabled:opacity-60"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            送信中...
          </>
        ) : (
          'パートナー資料を受け取る（無料）'
        )}
      </motion.button>

      {/* マイクロコピー */}
      <div className="flex flex-col items-center gap-1.5 text-xs text-[#5A6577] lg:text-sm">
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          1分で完了します
        </span>
        <span className="flex items-center gap-1">
          <PhoneOff className="h-3.5 w-3.5" />
          営業電話は一切いたしません
        </span>
        <span className="flex items-center gap-1">
          <Mail className="h-3.5 w-3.5" />
          資料はメールで即時お届けします
        </span>
      </div>
    </form>
  );
}
