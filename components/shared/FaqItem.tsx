// components/shared/FaqItem.tsx
'use client';
import React, { useState } from 'react';

type FaqItemProps = {
  question: string;
  answer: React.ReactNode;
};

export const FaqItem: React.FC<FaqItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 last:border-0">
      <button
        className="flex justify-between items-center w-full py-5 px-4 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center">
          <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold mr-3">
            Q
          </div>
          <h3 className="text-lg font-medium text-gray-900">{question}</h3>
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transform transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-screen opacity-100 pb-5' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="flex px-4 pt-2">
          <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 font-semibold mr-3 mt-1">
            A
          </div>
          <div className="text-gray-700">{answer}</div>
        </div>
      </div>
    </div>
  );
};