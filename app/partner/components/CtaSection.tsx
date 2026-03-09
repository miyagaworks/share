'use client';

import { motion } from 'framer-motion';
import { fadeUpVariants, useScrollInView } from './AnimationUtils';
import PartnerForm from './PartnerForm';

export default function CtaSection() {
  const { ref: headRef, inView: headInView } = useScrollInView();
  const { ref: formRef, inView: formInView } = useScrollInView();

  return (
    <section id="cta" className="bg-[#1B2A4A] py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-4">
        {/* 見出し */}
        <motion.div
          ref={headRef}
          initial="hidden"
          animate={headInView ? 'visible' : 'hidden'}
          variants={fadeUpVariants}
          className="mb-12 text-center"
        >
          <h2 className="mb-4 text-3xl font-bold leading-tight text-[#F5F3EF] lg:text-4xl">
            30分の相談が、御社の次の10年を
            <br className="hidden sm:block" />
            変えるかもしれません。
          </h2>
          <p className="text-left lg:text-center lg:text-lg" style={{ color: 'rgba(245, 243, 239, 0.8)' }}>
            補助金活用ガイド（無料）もこちらからお受け取りいただけます。
          </p>
        </motion.div>

        {/* フォーム */}
        <motion.div
          ref={formRef}
          initial="hidden"
          animate={formInView ? 'visible' : 'hidden'}
          variants={fadeUpVariants}
          className="mx-auto max-w-lg rounded-2xl border border-[#E8E6E1] bg-white p-6 lg:p-8"
          style={{ boxShadow: '0 4px 12px rgba(27, 42, 74, 0.08)' }}
        >
          <PartnerForm />
        </motion.div>
      </div>
    </section>
  );
}
