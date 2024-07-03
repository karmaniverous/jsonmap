import aliasPlugin, { Alias } from '@rollup/plugin-alias';
import commonjsPlugin from '@rollup/plugin-commonjs';
import jsonPlugin from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescriptPlugin from '@rollup/plugin-typescript';
import type { InputOptions, OutputOptions, RollupOptions } from 'rollup';
import dtsPlugin from 'rollup-plugin-dts';

const outputPath = `dist`;

const commonPlugins = [
  commonjsPlugin(),
  jsonPlugin(),
  nodeResolve(),
  typescriptPlugin(),
];

const commonAliases: Alias[] = [];

const commonInputOptions: InputOptions = {
  input: 'src/index.ts',
  plugins: [aliasPlugin({ entries: commonAliases }), commonPlugins],
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
    ...commonInputOptions,
    plugins: [commonInputOptions.plugins, dtsPlugin()],
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
  },
];

export default config;
