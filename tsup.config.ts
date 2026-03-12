import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'parser/index': 'src/parser/index.ts',
    'compiler/index': 'src/compiler/index.ts',
    'runtime/index': 'src/runtime/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  splitting: false,
  treeshake: true,
  minify: false,
  sourcemap: true,
})
