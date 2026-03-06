'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Calculator } from 'lucide-react';
import { fadeUpVariants, useScrollInView } from './AnimationUtils';
import { PartnerEvents } from '../utils/analytics';

function SliderInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix = '',
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm font-medium text-[#2D3748] lg:text-base">{label}</label>
        <span className="font-[Inter] text-sm font-bold text-[#1B2A4A]">
          {value.toLocaleString()}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-[#4A6FA5]"
      />
      <div className="mt-1 flex justify-between text-[10px] text-[#7B8794]">
        <span>
          {min.toLocaleString()}
          {suffix}
        </span>
        <span>
          {max.toLocaleString()}
          {suffix}
        </span>
      </div>
    </div>
  );
}

export default function RevenueCalculator() {
  const { ref, inView } = useScrollInView();

  const [customers, setCustomers] = useState(100);
  const [adoptionRate, setAdoptionRate] = useState(30);
  const [unitPrice, setUnitPrice] = useState(800);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasInteracted = useRef(false);

  const adoptedCompanies = Math.floor(customers * (adoptionRate / 100));
  const monthlyRevenue = adoptedCompanies * unitPrice;

  // GA4: シミュレーター操作イベント（debounce 1秒）
  const trackCalculator = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const adopted = Math.floor(customers * (adoptionRate / 100));
      PartnerEvents.calculatorUse(customers, adopted * unitPrice);
    }, 1000);
  }, [customers, adoptionRate, unitPrice]);

  useEffect(() => {
    if (!hasInteracted.current) return;
    trackCalculator();
  }, [customers, adoptionRate, unitPrice, trackCalculator]);

  const handleSliderChange = (setter: (v: number) => void) => (v: number) => {
    hasInteracted.current = true;
    setter(v);
  };
  const yearlyRevenue = monthlyRevenue * 12;
  const threeYearTotal = yearlyRevenue * 3;

  const results = [
    { label: '導入企業数', value: `${adoptedCompanies}社` },
    { label: '月間ストック収入', value: `¥${monthlyRevenue.toLocaleString()}` },
    { label: '年間ストック収入', value: `¥${yearlyRevenue.toLocaleString()}` },
    { label: '3年後の累計', value: `¥${threeYearTotal.toLocaleString()}` },
  ];

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={fadeUpVariants}
      className="mx-auto max-w-3xl rounded-2xl border border-[#E8E6E1] bg-white p-6 shadow-sm sm:p-8"
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="inline-flex rounded-lg bg-[#1B2A4A]/5 p-2.5">
          <Calculator className="h-5 w-5 text-[#1B2A4A]" />
        </div>
        <h3 className="text-lg font-bold text-[#2D3748] lg:text-xl">
          収益シミュレーター
        </h3>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* 入力 */}
        <div className="space-y-6">
          <p className="text-justify text-sm text-[#5A6577] lg:text-base">
            御社の状況に合わせて数値を調整してください。
          </p>
          <SliderInput
            label="既存法人顧客数"
            value={customers}
            onChange={handleSliderChange(setCustomers)}
            min={10}
            max={500}
            step={10}
            suffix="社"
          />
          <SliderInput
            label="デジタル名刺導入率"
            value={adoptionRate}
            onChange={handleSliderChange(setAdoptionRate)}
            min={10}
            max={80}
            step={5}
            suffix="%"
          />
          <SliderInput
            label="ユーザー単価（月額）"
            value={unitPrice}
            onChange={handleSliderChange(setUnitPrice)}
            min={500}
            max={2000}
            step={100}
            suffix="円"
          />
        </div>

        {/* 結果 */}
        <div>
          <div className="rounded-xl bg-[#1B2A4A]/5 p-5">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#1B2A4A]">
              シミュレーション結果
            </p>
            <div className="space-y-4">
              {results.map((r, i) => (
                <div key={r.label} className="flex items-center justify-between">
                  <span className="text-sm text-[#2D3748] lg:text-base">{r.label}</span>
                  <span
                    className={`font-[Inter] font-bold ${
                      i === results.length - 1
                        ? 'text-2xl text-[#1B2A4A]'
                        : 'text-lg text-[#1B2A4A]'
                    }`}
                  >
                    {r.value}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-[#5A6577]">
              ※ これに加えてNFCシール販売利益が上乗せされます
            </p>
          </div>

          <a
            href="#cta"
            onClick={(e) => {
              e.preventDefault();
              window.dispatchEvent(new CustomEvent('partner-preference', { detail: '資料をダウンロードしたい' }));
              document.getElementById('cta')?.scrollIntoView({ behavior: 'smooth' });
              PartnerEvents.ctaClick('calculator', 'download');
            }}
            className="mt-4 flex min-h-[44px] items-center justify-center rounded-lg bg-[#B8860B] px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#A0750A] lg:text-base"
          >
            詳しいシミュレーション資料をダウンロード
          </a>
        </div>
      </div>
    </motion.div>
  );
}
