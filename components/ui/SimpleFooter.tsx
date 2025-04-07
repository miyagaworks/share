// components/ui/SimpleFooter.tsx
import React from 'react';

export function SimpleFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm text-gray-500">
          &copy; {currentYear} Bialpha Inc. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default SimpleFooter;
