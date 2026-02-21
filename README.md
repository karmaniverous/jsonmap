# JsonMap

`JsonMap` is a JSON mapping library that facilitates the transformation of an input JSON object according to a set of declarative rules.

```bash
npm install @karmaniverous/jsonmap
```

`JsonMap` is _hyper-generic_: you bring your own mapping functions, which may be async and may be combined into complex transformation logic.

## Why?

Mapping data from one form into another is a critical requirement of virtually every application.

`JsonMap` decouples mapping structure from mapping logic — and drives that decoupling deep into the logic layer.

The `lib` object contains your mapping functions, organized however you like. The `map` object is a plain JSON object ([POJO](https://masteringjs.io/tutorials/fundamentals/pojo)) that expresses your mapping rules declaratively.

Because the `map` is a POJO:

- It can be stored in a database or config file.
- It does NOT express code as text, exposing a minimal threat surface.
- It **transforms application logic into structured configuration data**, enabling more generic, flexible applications.

## Quick Start

```ts
import _ from 'lodash';
import numeral from 'numeral';
import { JsonMap } from '@karmaniverous/jsonmap';

// 1. Create a lib object with your mapping functions.
const lib = { _, numeral };

// 2. Define a map — a POJO expressing your transformation rules.
const map = {
  name: {
    $: { method: '$.lib._.get', params: ['$.input', 'user.name'] },
  },
  greeting: {
    $: { method: '$.lib._.toUpper', params: '$.output.name' },
  },
};

// 3. Create a JsonMap instance and transform your input.
const jsonMap = new JsonMap(map, lib);
const output = await jsonMap.transform({ user: { name: 'Alice' } });
// → { name: 'Alice', greeting: 'ALICE' }
```

## Map Structure

The transformation output mirrors the structure of your `map` object. Values in the map can be:

- **Static values** — passed through to output unchanged.
- **Dynamic nodes** — objects with a single `$` key, containing one or more transformation steps.
- **Nested objects/arrays** — recursively processed.

### Dynamic Nodes

A dynamic node is an object with a single `$` key. Its value is either a single transform or an array of transforms executed in sequence:

```ts
// Single transform
{ $: { method: '$.lib._.get', params: ['$.input', 'some.path'] } }

// Transform pipeline — output of each step feeds into the next
{
  $: [
    { method: '$.lib._.get', params: ['$.input', 'value'] },
    { method: '$.lib.numeral', params: '$[0]' },
    { method: '$[0].format', params: '$0,0.00' },
  ],
}
```

Each transform step has:

| Property | Type | Description |
| --- | --- | --- |
| `method` | `string` | Path to the function to call (see [Path Syntax](#path-syntax)) |
| `params` | `string \| string[]` | One or more paths resolved as arguments to the method |

### Path Syntax

All `method` and `params` values use lodash-style dot paths with special root prefixes:

| Prefix | Resolves to |
| --- | --- |
| `$.lib.*` | Your `lib` object (e.g. `$.lib._.get`) |
| `$.input.*` | The original input data |
| `$.output.*` | The output built so far (enables progressive transforms) |
| `$[i].*` | Result of the _i_-th previous transform step in the current pipeline (0 = most recent) |

Paths without a `$` prefix are treated as literal strings.

### Progressive Transformations

Because transforms are processed in key order and `$.output.*` references the output built so far, later keys can reference earlier ones:

```ts
const map = {
  firstName: {
    $: { method: '$.lib._.get', params: ['$.input', 'first'] },
  },
  // This runs AFTER firstName because keys are sorted
  fullGreeting: {
    $: { method: '$.lib._.toUpper', params: '$.output.firstName' },
  },
};
```

### Private Keys (`$`-prefixed)

Keys starting with `$` are **stripped from the final output** but are available during transformation via `$.output.*`. This enables intermediate computations:

```ts
const map = {
  // Private: used for an API call, then stripped from output
  $apiParams: {
    merchantId: {
      $: { method: '$.lib._.get', params: ['$.input', 'merchant.id'] },
    },
  },
  // Public: references the private key's output
  merchantName: {
    $: {
      method: '$.lib.fetchMerchant',
      params: '$.output.$apiParams.merchantId',
    },
  },
};
```

### Controlling Key Stripping with `ignore`

The `ignore` option (a `string` or `RegExp`) controls which keys are stripped. The default is `/^\$/` (all `$`-prefixed keys). You can override it to keep specific keys:

```ts
// Keep $metadata in output, strip all other $-prefixed keys
const jsonMap = new JsonMap(map, lib, { ignore: '^\\$(?!metadata)' });
```

### Recursive Evaluation

If a dynamic node's output is itself a dynamic node (an object with a single `$` key), it will be re-evaluated recursively until a non-dynamic value is produced.

## API

### `new JsonMap(map, lib, options?)`

| Parameter | Type | Description |
| --- | --- | --- |
| `map` | `JsonMapMap` | The map definition (POJO) |
| `lib` | `JsonMapLib` | Object containing your mapping functions |
| `options` | `JsonMapOptions` | Optional. `{ ignore?: string \| RegExp }` — pattern for keys to strip from output (default: `/^\$/`) |

### `jsonMap.transform(input): Promise<Json>`

Transforms the input data according to the map. The transformation is asynchronous — your lib functions may be async.

## Full Example

```ts
import _ from 'lodash';
import numeral from 'numeral';
import { JsonMap } from '@karmaniverous/jsonmap';

const lib = { _, numeral };

const map = {
  foo: 'static value passed directly to output',
  bar: [
    {
      static: 'another static value',
      $remove: 'stripped from output (private key)',
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

const jsonMap = new JsonMap(map, lib);
const output = await jsonMap.transform(someInput);
```

## JSON Schema & Zod Schemas

This package exports [Zod](https://zod.dev/) schemas as the source of truth for all map-related types, plus a generated [JSON Schema](https://json-schema.org/) file for editor tooling and cross-language validation.

### IDE autocomplete for config files

Point your JSON map config file at the published schema:

```json
{
  "$schema": "node_modules/@karmaniverous/jsonmap/jsonmap.schema.json",
  "foo": "static value",
  "bar": {
    "$": {
      "method": "$.lib._.get",
      "params": ["$.input", "some.path"]
    }
  }
}
```

### Referencing the schema from other JSON Schema files

Use `$ref` to compose the JsonMap schema into your own:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "mappings": {
      "$ref": "node_modules/@karmaniverous/jsonmap/jsonmap.schema.json"
    }
  }
}
```

### Composing the Zod schemas in TypeScript

Import the exported Zod schemas to build on top of them:

```ts
import { z } from 'zod';
import {
  jsonMapMapSchema,
  jsonMapTransformSchema,
  jsonMapDynamicSchema,
  jsonMapOptionsSchema,
} from '@karmaniverous/jsonmap';

// Extend with your own config shape
const myConfigSchema = z.object({
  name: z.string(),
  map: jsonMapMapSchema,
  options: jsonMapOptionsSchema.optional(),
});

type MyConfig = z.infer<typeof myConfigSchema>;

// Validate at runtime
const config = myConfigSchema.parse(untrustedInput);
```

### Exported Schemas

| Schema | Describes |
| --- | --- |
| `jsonMapTransformSchema` | A single `{ method, params }` transform step |
| `jsonMapDynamicSchema` | A `{ $: ... }` dynamic value node |
| `jsonMapMapSchema` | A full recursive map definition (literals, objects, arrays) |
| `jsonMapOptionsSchema` | Constructor options (`{ ignore?: string \| RegExp }`) |

### Exported Types

All types are derived from their Zod schemas via `z.infer<>`:

| Type | Description |
| --- | --- |
| `JsonMapTransform` | A single transform step |
| `JsonMapDynamic` | A dynamic value node |
| `JsonMapMap` | A recursive map definition |
| `JsonMapOptions` | Constructor options |
| `JsonMapLib` | Library of mapping functions |
| `Json` | Any valid JSON value |
| `JsonFn` | JSON replacer/reviver function |
| `PathResolutionMap` | Map of path patterns to resolver functions |
| `PathResolutionParams` | Parameters for path resolution |

---

See more great templates and other tools on
[my GitHub Profile](https://github.com/karmaniverous)!
