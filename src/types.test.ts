import { describe, expect, it } from 'vitest';

import {
  jsonMapDynamicSchema,
  jsonMapMapSchema,
  jsonMapOptionsSchema,
  jsonMapTransformSchema,
} from './types';

describe('Zod schemas', () => {
  describe('jsonMapTransformSchema', () => {
    it('accepts valid transform with string params', () => {
      const result = jsonMapTransformSchema.safeParse({
        method: '$.lib._.get',
        params: '$.input',
      });
      expect(result.success).toBe(true);
    });

    it('accepts valid transform with array params', () => {
      const result = jsonMapTransformSchema.safeParse({
        method: '$.lib._.get',
        params: ['$.input', 'foo.bar'],
      });
      expect(result.success).toBe(true);
    });

    it('rejects missing method', () => {
      const result = jsonMapTransformSchema.safeParse({
        params: '$.input',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('jsonMapDynamicSchema', () => {
    it('accepts single transform', () => {
      const result = jsonMapDynamicSchema.safeParse({
        $: { method: '$.lib._.get', params: '$.input' },
      });
      expect(result.success).toBe(true);
    });

    it('accepts array of transforms', () => {
      const result = jsonMapDynamicSchema.safeParse({
        $: [
          { method: '$.lib._.get', params: ['$.input', 'foo'] },
          { method: '$.lib.numeral', params: '$[0]' },
        ],
      });
      expect(result.success).toBe(true);
    });
  });

  describe('jsonMapMapSchema', () => {
    it('validates a full map definition', () => {
      const map = {
        foo: 'static value',
        bar: [
          {
            static: 'another static value',
            dynamic: {
              $: [
                {
                  method: '$.lib._.get',
                  params: ['$.input', 'dynamodb.NewImage.roundup.N'],
                },
                { method: '$.lib.numeral', params: '$[0]' },
                { method: '$[0].format', params: '$0,0.00' },
              ],
            },
          },
        ],
        progressive: {
          $: {
            method: '$.lib._.toUpper',
            params: '$.output.bar[0].static',
          },
        },
      };

      const result = jsonMapMapSchema.safeParse(map);
      expect(result.success).toBe(true);
    });

    it('accepts literal values', () => {
      expect(jsonMapMapSchema.safeParse('hello').success).toBe(true);
      expect(jsonMapMapSchema.safeParse(42).success).toBe(true);
      expect(jsonMapMapSchema.safeParse(null).success).toBe(true);
      expect(jsonMapMapSchema.safeParse(true).success).toBe(true);
    });
  });

  describe('jsonMapOptionsSchema', () => {
    it('accepts string ignore', () => {
      const result = jsonMapOptionsSchema.safeParse({ ignore: '^\\$' });
      expect(result.success).toBe(true);
    });

    it('accepts RegExp ignore', () => {
      const result = jsonMapOptionsSchema.safeParse({ ignore: /^\$/ });
      expect(result.success).toBe(true);
    });

    it('accepts empty options', () => {
      const result = jsonMapOptionsSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });
});
