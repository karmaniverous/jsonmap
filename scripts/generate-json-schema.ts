/**
 * Generates `jsonmap.schema.json` from the Zod map schema.
 *
 * @remarks
 * Run via `npx ts-node --esm scripts/generate-json-schema.ts` or the
 * `generate:schema` npm script.
 *
 * @module
 */

import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { jsonMapMapSchema } from '../src/types.ts';

const jsonSchema = zodToJsonSchema(jsonMapMapSchema, {
  name: 'JsonMapMap',
});

const outPath = resolve(import.meta.dirname ?? '.', '..', 'jsonmap.schema.json');

writeFileSync(outPath, JSON.stringify(jsonSchema, null, 2) + '\n');

console.log(`Wrote ${outPath}`);
