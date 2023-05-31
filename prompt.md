Here is a usage example of a Javascript class called JsonMap that applies transformations to a JSON object. The class should exploit the lodash library where relevant.

```js
import _ from 'lodash';
import numeral from 'numeral';
import { JsonMap } from 'json-map';

const fetchData = async (entityToken, entityId) => {
  // This async code fetches data from an API.
};

// This object is a collection of function libraries.
const lib = { _, fetchData, numeral, String };

// This is the data mapping configuration.
// The output will have the same structure as this object.
const map = {
  txn: {
    txnId: {
      /*
      An object value with a single key of $ indicates a transformation.

      A transformation is composed of steps. Each step is an object with 3 keys: object, method, and params. Each transformation step runs a method of an object, optionally passing it a parameter array.

      If the $ value is an object, there is a single transformation step. Multiple steps can be collected into an array.
      */
      $: {
        /*
        The object property itentifies the object whose method will be run. The object is resolved using a special syntax:

        $.lib refers to the JsonMap instance lib property.

        $.input refers to the input data object. 
        
        $.output refers to the output object. The transformation is progressive, so the value currently being processed can refer to previously processed values.

        $[i], where i is an integer, refers to the ith previous transformation step, so $[0] is the last step, $[1] is the one before that, and so on. This syntax should account for the fact that a previous step might return an object, in which case $[i] might be followed by path information, e.g. $[0].path.

        Beyond these base objects, lodash-style path syntax applies. If none of the patterns above fits, then object should be treated as a string.
        */
        object: '$.lib._',

        /*
        The method property identifies the method that will be executed on object. It should be a string.
        */
        method: 'get',

        /*
        The params property is an array of values to be passed to method. These values should be resolved using the same syntax as object. If none of the special patterns fits, then the value should be treated as a string.
        */
        params: ['$.input', 'dynamodb.NewImage.txnId.S'],
      },
    },
    roundup: {
      $: [
        {
          object: '$.lib._',
          method: 'get',
          params: ['$.input', 'dynamodb.NewImage.roundup.N'],
        },
        {
          object: '$.lib',
          method: 'numeral',
          // If there is only a single param, no array is necessary.
          params: '$[0]',
        },
        {
          object: '$[0]',
          method: 'format',
          params: ['$0,0.00'],
        },
      ],
    },
    // Static values & structures will simply be passed through to the output.
    foo: 'bar',
    baz: {
      object: '$.lib.String',
      method: 'toUpperCase',
      params: '$.foo',
    },
    fetch: {
      object: '$.lib',
      // This is an async function that returns an object!
      method: 'fetchData',
      // The second parameter leverages a previously processed value.
      params: ['txn', '$.output.txn.txnId'],
    },
  },
};

// This is some sample input data to be transformed.
const input = {
  eventID: 'e560bbcaee919e16a6a8ce8dc3fe97ab',
  eventName: 'MODIFY',
  eventVersion: '1.1',
  eventSource: 'aws:dynamodb',
  awsRegion: 'us-east-1',
  dynamodb: {
    ApproximateCreationDateTime: 1685071094,
    Keys: {
      entityPK: {
        S: 'txn!',
      },
      entitySK: {
        S: 'txnId#_tQ72mu5Iy2PYJ33c497g',
      },
    },
    NewImage: {
      txnUserIdPK: {
        S: 'txn!|userId#Xmv51c7lYiiTIU22_UlCD',
      },
      created: {
        N: '1685071087846',
      },
      netValue: {
        N: '365.3',
      },
      methodId: {
        S: 'KDvC6leEzkAAf8-akh_vO',
      },
      entityPK: {
        S: 'txn!',
      },
      userId: {
        S: 'Xmv51c7lYiiTIU22_UlCD',
      },
      entitySK: {
        S: 'txnId#_tQ72mu5Iy2PYJ33c497g',
      },
      updater: {
        S: 'api-txn-v0-bali',
      },
      merchantId: {
        S: 'eQMZ2ikPmUd3cqrptbpna',
      },
      roundup: {
        N: '0.7',
      },
      txnMerchantIdPK: {
        S: 'txn!|merchantId#eQMZ2ikPmUd3cqrptbpna',
      },
      updated: {
        N: '1685071094685',
      },
      txnId: {
        S: '_tQ72mu5Iy2PYJ33c497g',
      },
      txnMethodIdPK: {
        S: 'txn!|methodId#KDvC6leEzkAAf8-akh_vO',
      },
    },
    OldImage: {
      txnUserIdPK: {
        S: 'txn!|userId#Xmv51c7lYiiTIU22_UlCD',
      },
      created: {
        N: '1685071087846',
      },
      netValue: {
        N: '429.74',
      },
      methodId: {
        S: 'KDvC6leEzkAAf8-akh_vO',
      },
      entityPK: {
        S: 'txn!',
      },
      userId: {
        S: 'Xmv51c7lYiiTIU22_UlCD',
      },
      entitySK: {
        S: 'txnId#_tQ72mu5Iy2PYJ33c497g',
      },
      updater: {
        S: 'api-txn-v0-bali',
      },
      merchantId: {
        S: 'eQMZ2ikPmUd3cqrptbpna',
      },
      roundup: {
        N: '0.26',
      },
      txnMerchantIdPK: {
        S: 'txn!|merchantId#eQMZ2ikPmUd3cqrptbpna',
      },
      updated: {
        N: '1685071087846',
      },
      txnId: {
        S: '_tQ72mu5Iy2PYJ33c497g',
      },
      txnMethodIdPK: {
        S: 'txn!|methodId#KDvC6leEzkAAf8-akh_vO',
      },
    },
    SequenceNumber: '31120900000000039175922358',
    SizeBytes: 801,
    StreamViewType: 'NEW_AND_OLD_IMAGES',
  },
  eventSourceARN:
    'arn:aws:dynamodb:us-east-1:546652796775:table/api-txn-v0-bali/stream/2023-05-19T12:57:41.682',
};

// This initializes a JsonMap instance.
const jsonMap = new JsonMap(lib, map);

// This transforms the sample input data.
const result = jsonMap.transform(input);

// This is the result!
// {
//   txn: {
//     txnId: '_tQ72mu5Iy2PYJ33c497g',
//     roundup: '$0.70',
//   },
//   foo: 'bar',
//   baz: 'BAR',
//   fetch: {
//     statusCode: 200,
//     message: 'asynchronously fetched data!'
//   }
// }
```

The class should accommodate deep placement of transformations within the map object. It should also recursively account for transformation objects that resolve into transformation objects.

Fully implement the JsonMap class with jsdoc comments.
