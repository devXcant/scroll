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
          elevated: '#000000',
          card: '#000000',
          surface: '#000000',
          'surface-hover': '#000000',
          border: 'rgba(255,255,255,0.10)',
          'border-glow': 'rgba(217,93,26,0.4)',
          text: '#FFFFFF',
          muted: '#999999',
          dim: '#666666',
          accent: '#D95D1A',
          'accent-soft': 'rgba(217,93,26,0.12)',
          lock: '#D95D1A',
          danger: '#FF4444',
          success: '#22C55E',
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
