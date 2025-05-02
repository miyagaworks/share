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
      },
    },
  },
  plugins: [],
};
