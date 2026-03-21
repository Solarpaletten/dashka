/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'de-gold':  '#FFCC00',
        'de-black': '#1a1a1a',
      },
      keyframes: {
        // Mic pulse — used in ConversationMode recording state
        'mic-pulse': {
          '0%':   { boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.7)' },
          '70%':  { boxShadow: '0 0 0 16px rgba(239, 68, 68, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(239, 68, 68, 0)' },
        },
      },
      animation: {
        'mic-pulse': 'mic-pulse 1.2s ease-out infinite',
      },
    }
  },
  plugins: []
}
