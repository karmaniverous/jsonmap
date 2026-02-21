import type { Alias } from '@rollup/plugin-alias';
import aliasPlugin from '@rollup/plugin-alias';
import commonjsPlugin from '@rollup/plugin-commonjs';
import jsonPlugin from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescriptPlugin from '@rollup/plugin-typescript';
import type { InputOptions, RollupOptions } from 'rollup';
import dtsPlugin from 'rollup-plugin-dts';

const outputPath = `dist`;

// Rollup writes bundle outputs; the TS plugin should only transpile.
// - outputToFilesystem=false avoids outDir/dir validation errors for multi-output builds.
// - incremental=false avoids TS build-info state referencing transient Rollup config artifacts.
const typescript = typescriptPlugin({
  tsconfig: './tsconfig.json',
  outputToFilesystem: false,
  // Only compile bundled sources; prevents transient Rollup config artifacts
  // (e.g. rollup.config-*.mjs) from being pulled into the TS program.
  include: ['src/**/*.ts'],
  exclude: ['**/*.test.ts', '**/*.test.tsx', '**/__tests__/**'],

  // Override repo tsconfig settings for bundling.
  noEmit: false,
  declaration: false,
  declarationMap: false,
  incremental: false,
  allowJs: false,
  checkJs: false,
});

const commonPlugins = [
  commonjsPlugin(),
  jsonPlugin(),
  nodeResolve(),
  typescript,
];

const commonAliases: Alias[] = [];

const commonInputOptions: InputOptions = {
  input: 'src/index.ts',
  plugins: [aliasPlugin({ entries: commonAliases }), ...commonPlugins],
};

const config: RollupOptions[] = [
  // ESM output.
  {
    ...commonInputOptions,
    output: [
      {
        extend: true,
        file: `${outputPath}/index.mjs`,
        format: 'esm',
      },
    ],
  },

  // CommonJS output.
  {
    ...commonInputOptions,
    output: [
      {
        extend: true,
        file: `${outputPath}/index.cjs`,
        format: 'cjs',
      },
    ],
  },

  // Type definitions output.
  {
    input: 'src/index.ts',
    output: [
      {
        extend: true,
        file: `${outputPath}/index.d.ts`,
        format: 'esm',
      },
      {
        extend: true,
        file: `${outputPath}/index.d.mts`,
        format: 'esm',
      },
      {
        extend: true,
        file: `${outputPath}/index.d.cts`,
        format: 'cjs',
      },
    ],
    plugins: [dtsPlugin()],
  },
];

export default config;
