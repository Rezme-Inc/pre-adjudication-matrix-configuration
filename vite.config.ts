import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig(async () => {
  // Dynamically import the React plugin to avoid ESM/require interop issues
  const reactPlugin = (await import('@vitejs/plugin-react')).default
  return {
    plugins: [reactPlugin(), tsconfigPaths()]
  }
})
