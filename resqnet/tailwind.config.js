/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        emergency: '#DC2626',
        'emergency-dark': '#991B1B',
        safe: '#16A34A',
        warning: '#D97706',
      },
      animation: {
        'pulse-fast': 'pulse 0.8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      borderWidth: { '0.5': '0.5px' },
      opacity: { '3': '0.03', '8': '0.08', '12': '0.12', '15': '0.15', '25': '0.25' },
    },
  },
  plugins: [],
}
