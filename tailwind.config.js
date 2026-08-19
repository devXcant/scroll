/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './lib/**/*.{js,jsx,ts,tsx}',
    './hooks/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        scroll: {
          bg: '#000000',
          elevated: 'rgba(255,255,255,0.04)',
          card: 'rgba(255,255,255,0.07)',
          surface: 'rgba(255,255,255,0.08)',
          'surface-hover': 'rgba(255,255,255,0.12)',
          border: 'rgba(255,255,255,0.16)',
          'border-glow': 'rgba(217,93,26,0.5)',
          text: '#FFFFFF',
          muted: '#C4C4CE',
          dim: '#8E8E99',
          accent: '#D95D1A',
          'accent-soft': 'rgba(217,93,26,0.18)',
          lock: '#D95D1A',
          danger: '#FF5A5A',
          success: '#3DDC84',
          amber: '#E08A4D',
        },
      },
      fontFamily: {
        display: ['SpaceGrotesk_700Bold'],
        'display-semibold': ['SpaceGrotesk_600SemiBold'],
        'display-medium': ['SpaceGrotesk_500Medium'],
        body: ['DMSans_400Regular'],
        'body-medium': ['DMSans_500Medium'],
      },
      borderRadius: {
        scroll: '24px',
        'scroll-md': '16px',
        'scroll-sm': '10px',
      },
    },
  },
  plugins: [],
};
