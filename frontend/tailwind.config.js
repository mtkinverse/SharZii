// /** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}", "*.{js,ts,jsx,tsx,mdx}"],
    theme: {
        extend: {
            colors: {
                'theme-0': '#0F3D2E', // Dark green
                'theme-1': '#1A5D42', // Medium dark green
                'theme-2': '#267356', // Medium green
                'theme-3': '#FFFFFF', // White
                'theme-4': '#111111', // Very dark black
                'theme-5': '#222222', // Dark black
                'theme-6': '#333333', // Medium black
                'theme-7': '#444444', // Light black
            }
        },
    },
    plugins: [],
}