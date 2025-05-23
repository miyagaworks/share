// tailwind.config.js
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        corporate: {
          primary: 'var(--color-corporate-primary)',
          secondary: 'var(--color-corporate-secondary)',
        },
        // iOS ダークモード対応色
        'ios-safe-black': '#000000',
        'ios-safe-white': '#ffffff',
      },
    },
  },
  plugins: [
    // iOS ダークモード対応プラグイン
    function ({ addUtilities }) {
      addUtilities({
        '.ios-safe-text-black': {
          color: '#000000 !important',
          '-webkit-text-fill-color': '#000000 !important',
        },
        '.ios-safe-text-white': {
          color: '#ffffff !important',
          '-webkit-text-fill-color': '#ffffff !important',
        },
        '.ios-safe-bg-white': {
          'background-color': '#ffffff !important',
        },
        '.ios-safe-bg-black': {
          'background-color': '#000000 !important',
        },
      });
    },
  ],
};