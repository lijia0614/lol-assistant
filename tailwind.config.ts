import type { Config } from 'tailwindcss'

export default {
  content: ['./src/renderer/**/*.{html,tsx,ts}'],
  theme: {
    extend: {
      colors: {
        blue: { team: '#4da6ff' },
        red: { team: '#ff4d4d' },
        surface: 'rgba(10, 12, 16, 0.85)',
      }
    }
  },
  plugins: []
} satisfies Config
