import { defineConfig } from 'vitest/config'
import mdx from '@mdx-js/rollup'
import remarkGfm from 'remark-gfm'
import remarkDirective from 'remark-directive'
import remarkDirectiveRehype from 'remark-directive-rehype'
import rehypePrettyCode from 'rehype-pretty-code'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [
    mdx({
      providerImportSource: '@mdx-js/react',
      remarkPlugins: [remarkGfm, remarkDirective, remarkDirectiveRehype],
      rehypePlugins: [
        [rehypePrettyCode, { theme: 'one-dark-pro', keepBackground: true }],
      ],
    }),
    react(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'happy-dom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
  },
})
