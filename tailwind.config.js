/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Nunito', 'Inter', 'sans-serif'],
      },
      colors: {
        primary: '#1A90FF',
        secondary: '#00E676',
        accentRed: '#FF1744',
        accentGold: '#FFD600',
        darkBackground: '#181A20',
        lightText: '#F5F7FA',
        darkText: '#232946',
        tableFelt: '#232946',
        tableBorder: '#FFD600',
        cardBackground: '#FFF',
        borderColor: '#2C3E50',
        buttonHover: '#0D47A1',
        success: '#00E676',
        error: '#FF1744',
        warning: '#FFD600',
        info: '#1A90FF',
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
      },
      borderRadius: {
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
      },
      fontSize: {
        'xs': '12px',
        'sm': '14px',
        'md': '16px',
        'lg': '22px',
        'xl': '28px',
      },
      zIndex: {
        'overlay': '100',
      },
    },
  },
  plugins: [],
}