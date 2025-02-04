# JsonMap

`JsonMap` is a JSON mapping library, which facilitates the transformation of some input JSON object according to a set of rules.

Installing `JsonMap` is easy:

```bash
npm install @karmaniverous/jsonmap
```

`JsonMap` is _hyper-generic_: you bring your own mapping functions, which may be async and may be combined into complex transformation logic.

To do this, create a `lib` object, which combines your mapping function libraries into a single object. You can use async functions and organize this in any way that makes sense.

For example:

```js
import _ from 'lodash';
import numeral from 'numeral';

const lib = { _, numeral };
```

You also need to create a `map` object. This is a [plain old Javascript object](https://masteringjs.io/tutorials/fundamentals/pojo) (POJO) that expresses your mapping rules.

## Why?

Mapping data from one form into another is a critical requirement of virtually every application.

`JsonMap` decouples mapping structure from mapping logic... and drives that decoupling deep into the logic layer.

The `lib` object contains the remaining logic that CAN'T be decoupled, and can be used consistently across your application.

The `map` object is a [POJO](https://masteringjs.io/tutorials/fundamentals/pojo), which can easily be stored in a database yet does NOT express code as text and thus exposes a minimal threat surface.

**This allows you to transform application logic into structured configuration data and write more generic, flexible applications.**

## Usage

The transformation output will reflect the structure of your `map` object and include any static values. To add mapping logic, use a structured value that consists of an object with a single `$` key, like this:

```ts
const map = {
  foo: 'static value passed directly to output',
  // Structure passed directly to output.
  bar: [
    {
      static: 'another static value',
      // Keys starting with $ are available for progressive transformations but
      // are not passed to the output object.
      $remove: 'this should be removed from the output',
      // Value defined by a mapping rule expressing an array of transformation
      // objects. If there is only a single transformation object, no array is
      // necessary. The output of the last transformation step is returned as
      // the mapped value.
      dynamic: {
        $: [
          // Each transformation object uses a special syntax to reference an
          // a method to run and an array of parameters to pass to it.
          {
            method: '$.lib._.get',
            params: ['$.input', 'dynamodb.NewImage.roundup.N'],
          },
          // The special syntax uses lodash-style paths. Its root object can
          // reference the lib object ($.lib...), the transformation input
          // ($.input...), the output generated so far ($.output...), or the
          // outputs of previous transformation steps ($.[0]..., $.[1]...).
          {
            method: '$.lib.numeral',
            // If there is only a single param, no array is necessary.
            params: '$[0]',
          },
          {
            method: '$[0].format',
            params: '$0,0.00',
          },
        ],
      },
    },
  ],
  // Value defined by a single mapping rule executing a method against a
  // previous output of the same mapping object.
  progressive: {
    $: {
      method: '$.lib._.toUpper',
      params: '$.output.bar[0].static',
    },
  },
  $remove: 'this should be removed from the output',
};
```

The transformation process is _generic_ and _asynchronous_. Feel free to use any function from any source in your `lib` object.

Your `lib` object can also include locally defined or anonymous functions. Combined with the `$[i]...` syntax, this allows for complex branching transformation logic.

Mapping objects are _recursive_. If a mapping object (i.e. `{ $: ... }`) renders another mapping object, it will be processed recursively until it does not.

Input objects can contain data of any kind, including functions. These can be executed as methods of their parent objects using transformation steps.

Once a `JsonMap` instance is configured, it can be executed against any input. Configure & execute a `JsonMap` instance like this:

```js
import { JsonMap } from '@karmaniverous/jsonmap';

// Assumes map & lib are already defined as above.
const jsonMap = new JsonMap(map, lib);

// Assumes some input data object is already defined.
const output = await jsonMap.transform(input);
```

The [unit tests](https://github.com/karmaniverous/jsonmap/blob/main/lib/JsonMap/JsonMap.test.js) demonstrate this example in action.

---

See more great templates and other tools on
[my GitHub Profile](https://github.com/karmaniverous)!
