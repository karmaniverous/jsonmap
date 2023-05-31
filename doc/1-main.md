# json-map

`JsonMap` is a JSON mapping library, which facilitates the transformation of some input JSON object according to a set of rules.

Installing `JsonMap` is easy:

```bash
npm install @karmaniverous/json-map
```

`JsonMap` is _hyper-generic_: you bring your own mapping functions, which may be async and may be combined into complex transformation logic.

To do this, create a `lib` object, which combines your mapping function libraries into a single object. You can use async functions and organize this in any way that makes sense.

For example:

```js
import _ from 'lodash';
import numeral from 'numeral';

const lib = { _, numeral };
```

You also need to create a `map` object. This is a plain Javascript object that expresses your mapping rules.

The transformation output will reflect the structure of your `map` object and include any static values. To add mapping logic, use a structured value that consists of an object with a single `$` key, like this:

```js
const map = {
  key1: 'static value passed directly to output',
  // Structure passed directly to output.
  key2: [
    {
      key2a: 'another static value',
      // Value defined by mapping rule with an array of transformation objects.
      // If there is only a single transformation object, no array is necessary.
      key2b: {
        $: [
          // Each transformation object uses a special syntax to reference an
          // object, a method to run on it, and an array of parameters to pass.
          {
            object: '$.lib._',
            method: 'get',
            params: ['$.input', 'dynamodb.NewImage.roundup.N'],
          },
          // The special syntax uses lodash-style paths. Its root object can
          // reference the lib object ($.lib...), the transformation input
          // ($.input...), the output generated so far ($.output...), or the
          // outputs of previous transformation steps ($.[0]..., $.[1]...).
          {
            object: '$.lib',
            method: 'numeral',
            // If there is only a single param, no array is necessary.
            params: '$[0]',
          },
          {
            object: '$[0]',
            method: 'format',
            params: '$0,0.00',
          },
        ],
      },
    },
  ],
};
```

The transformation process is _generic_ and _asynchronous_. Feel free to use any function from any source in your `lib` object.

Your `lib` object can also include locally defined or anonymous functions. Combined with the `$[i]...` syntax, this allows for complex branching transformation logic.

Mapping objects are _recursive_. If a mapping object (i.e. `{ $: ... }`) renders another mapping object, it will be processed recursively until it does not.

Input objects can contain data of any kind, including functions. These can be executed as methods of their parent objects using transformation steps.

Once a `JsonMap` instance is configured, it can be executed against any input. Configure & execute a `JsonMap` instance like this:

```js
import { JsonMap } from '@karmaniverous/json-map';

// Assumes lib & map are already defined as above.
const jsonMap = new JsonMap(lib, map);

// Assumes some input data object is already defined.
const output = await jsonMap.transform(input);
```
