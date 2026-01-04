/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                heading: ['Outfit', 'sans-serif'],
            },
            colors: {
                // Premium Palette
                'farm-green': {
                    DEFAULT: '#10B981', // Emerald 500
                    glow: '#34D399',    // Emerald 400
                    dim: 'rgba(16, 185, 129, 0.1)'
                },
                'farm-dark': '#0B0F19', // Deep Space
                'farm-card': 'rgba(30, 41, 59, 0.7)', // Slate 800 with opacity
                'farm-accent': '#0EA5E9', // Sky 500
                'farm-gold': '#F59E0B',   // Amber 500
                'farm-alert': '#EF4444',  // Red 500
            },
            backdropBlur: {
                xs: '2px',
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'float': 'float 6s ease-in-out infinite',
                'slide-in': 'slideIn 0.5s ease-out forwards',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                slideIn: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                }
            }
        },
    },
    plugins: [],
}
