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
        // パートナーLP カラーパレット
        partner: {
          primary: {
            DEFAULT: '#1B2A4A',
            light: '#243556',
            dark: '#131E36',
          },
          secondary: {
            DEFAULT: '#4A6FA5',
            light: '#5A7FB5',
            muted: '#6B87A8',
          },
          accent: {
            DEFAULT: '#B8860B',
            hover: '#A0750A',
            light: '#C8913A',
          },
          positive: '#2D8659',
          negative: '#9B4D3A',
          'warm-brown': '#8B7355',
        },
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