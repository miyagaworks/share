// components/shared/FaqSection.tsx
import React from 'react';
import { FaqItem } from './FaqItem';

type FaqData = {
  question: string;
  answer: React.ReactNode;
};

type FaqSectionProps = {
  faqs: FaqData[];
  title?: string;
};

export const FaqSection: React.FC<FaqSectionProps> = ({ faqs, title }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {title && <h2 className="text-2xl font-bold mb-6">{title}</h2>}
      <div className="divide-y divide-gray-200 rounded-lg bg-white">
        {faqs.map((faq, index) => (
          <FaqItem key={index} question={faq.question} answer={faq.answer} />
        ))}
      </div>
    </div>
  );
};
