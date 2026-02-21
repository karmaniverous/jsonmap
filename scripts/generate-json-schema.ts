/**
 * Generates `jsonmap.schema.json` from the Zod map schema.
 *
 * @remarks
 * Run via the `generate:schema` npm script.
 */

import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { z } from 'zod';

import { jsonMapMapSchema } from '../src/types.js';

const jsonSchema = z.toJSONSchema(jsonMapMapSchema, {
  unrepresentable: 'any',
});

const outPath = resolve(import.meta.dirname, '..', 'jsonmap.schema.json');

writeFileSync(outPath, JSON.stringify(jsonSchema, null, 2) + '\n');

console.log(`Wrote ${outPath}`);
