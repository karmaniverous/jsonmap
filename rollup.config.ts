import terserPlugin from '@rollup/plugin-terser';
import typescriptPlugin from '@rollup/plugin-typescript';
import type { InputOptions, OutputOptions, RollupOptions } from 'rollup';
import dtsPlugin from 'rollup-plugin-dts';

// Derive outputPath from package name.
const npmPackageRegex =
  /^(?:(?<scope>@[a-z0-9-~][a-z0-9-._~]*)\/)?(?<name>[a-z0-9-~][a-z0-9-._~]*)$/;
const packageName =
  process.env.npm_package_name?.match(npmPackageRegex)?.groups?.name ?? 'index';
const outputPath = `dist/index`;

const commonInputOptions: InputOptions = {
  input: 'src/index.ts',
  plugins: [typescriptPlugin()],
};

const iifeCommonOutputOptions: OutputOptions = {
  name: packageName,
};

const config: RollupOptions[] = [
  // ESM output.
  {
    ...commonInputOptions,
    output: [{ extend: true, file: `${outputPath}.mjs`, format: 'esm' }],
  },

  // IIFE output.
  {
    ...commonInputOptions,
    output: [
      {
        ...iifeCommonOutputOptions,
        extend: true,
        file: `${outputPath}.iife.js`,
        format: 'iife',
      },

      // Minified IIFE output.
      {
        ...iifeCommonOutputOptions,
        extend: true,
        file: `${outputPath}.iife.min.js`,
        format: 'iife',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        plugins: [terserPlugin()],
      },
    ],
  },

  // CommonJS output.
  {
    ...commonInputOptions,
    output: [
      {
        extend: true,
        file: `${outputPath}.cjs`,
        format: 'cjs',
      },
    ],
  },

  // Type definitions output.
  {
    ...commonInputOptions,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    plugins: [commonInputOptions.plugins, dtsPlugin()],
    output: [
      {
        extend: true,
        file: `${outputPath}.d.ts`,
        format: 'esm',
      },
      {
        extend: true,
        file: `${outputPath}.d.mts`,
        format: 'esm',
      },
      {
        extend: true,
        file: `${outputPath}.d.cts`,
        format: 'cjs',
      },
    ],
  },
];

export default config;
