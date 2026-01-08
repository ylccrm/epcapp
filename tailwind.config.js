/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        mac: {
          blue: {
            50: '#EBF5FF',
            100: '#D6EBFF',
            200: '#ADD6FF',
            300: '#85C2FF',
            400: '#5CADFF',
            500: '#007AFF',
            600: '#0066D6',
            700: '#0052AD',
            800: '#003D85',
            900: '#00295C',
          },
          gray: {
            50: '#F5F5F7',
            100: '#E8E8ED',
            200: '#D2D2D7',
            300: '#AEAEB2',
            400: '#8E8E93',
            500: '#636366',
            600: '#48484A',
            700: '#3A3A3C',
            800: '#2C2C2E',
            900: '#1C1C1E',
          },
          bg: {
            primary: '#FFFFFF',
            secondary: '#F5F5F7',
            tertiary: '#E8E8ED',
          },
        },
      },
      boxShadow: {
        'mac-sm': '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
        'mac': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'mac-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.03)',
        'mac-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)',
      },
      borderRadius: {
        'mac': '10px',
        'mac-lg': '14px',
        'mac-xl': '18px',
      },
    },
  },
  plugins: [],
};
