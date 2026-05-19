import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/**/*.d.ts',
        'src/test/**',
        'src/**/*.test.{ts,tsx}',
        // Páginas UI complejas — se cubren con E2E, no tests unitarios
        'src/pages/**',
        'src/components/Sidebar.tsx',
        'src/App.tsx',
        // Componentes de diseño puro (sin lógica de negocio)
        'src/components/ui/minimal-card.tsx',
        'src/components/ui/texture-card.tsx',
      ],
      thresholds: {
        lines: 75,
        functions: 55,  // sube a ~80 cuando api.ts tenga tests
        branches: 65,
        statements: 73,
      },
    },
  },
})
