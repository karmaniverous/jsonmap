import { expect } from 'chai';

import {
  jsonMapDynamicSchema,
  jsonMapMapSchema,
  jsonMapOptionsSchema,
  jsonMapTransformSchema,
} from './types';

describe('Zod schemas', function () {
  describe('jsonMapTransformSchema', function () {
    it('accepts valid transform with string params', function () {
      const result = jsonMapTransformSchema.safeParse({
        method: '$.lib._.get',
        params: '$.input',
      });
      expect(result.success).to.be.true;
    });

    it('accepts valid transform with array params', function () {
      const result = jsonMapTransformSchema.safeParse({
        method: '$.lib._.get',
        params: ['$.input', 'foo.bar'],
      });
      expect(result.success).to.be.true;
    });

    it('rejects missing method', function () {
      const result = jsonMapTransformSchema.safeParse({
        params: '$.input',
      });
      expect(result.success).to.be.false;
    });
  });

  describe('jsonMapDynamicSchema', function () {
    it('accepts single transform', function () {
      const result = jsonMapDynamicSchema.safeParse({
        $: { method: '$.lib._.get', params: '$.input' },
      });
      expect(result.success).to.be.true;
    });

    it('accepts array of transforms', function () {
      const result = jsonMapDynamicSchema.safeParse({
        $: [
          { method: '$.lib._.get', params: ['$.input', 'foo'] },
          { method: '$.lib.numeral', params: '$[0]' },
        ],
      });
      expect(result.success).to.be.true;
    });
  });

  describe('jsonMapMapSchema', function () {
    it('validates a full map definition', function () {
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
      expect(result.success).to.be.true;
    });

    it('accepts literal values', function () {
      expect(jsonMapMapSchema.safeParse('hello').success).to.be.true;
      expect(jsonMapMapSchema.safeParse(42).success).to.be.true;
      expect(jsonMapMapSchema.safeParse(null).success).to.be.true;
      expect(jsonMapMapSchema.safeParse(true).success).to.be.true;
    });
  });

  describe('jsonMapOptionsSchema', function () {
    it('accepts string ignore', function () {
      const result = jsonMapOptionsSchema.safeParse({ ignore: '^\\$' });
      expect(result.success).to.be.true;
    });

    it('accepts RegExp ignore', function () {
      const result = jsonMapOptionsSchema.safeParse({ ignore: /^\$/ });
      expect(result.success).to.be.true;
    });

    it('accepts empty options', function () {
      const result = jsonMapOptionsSchema.safeParse({});
      expect(result.success).to.be.true;
    });
  });
});
