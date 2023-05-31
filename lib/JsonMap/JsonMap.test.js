/* eslint-env mocha */

// npm imports
import { expect } from 'chai';
import _ from 'lodash';
import numeral from 'numeral';
import { JsonMap } from '../index.js';

const lib = { _, numeral };

const map = {
  foo: 'static value passed directly to output',
  // Structure passed directly to output.
  bar: [
    {
      static: 'another static value',
      // Value defined by a mapping rule expressing an array of transformation
      // objects. If there is only a single transformation object, no array is
      // necessary. The output of the last transformation step is returned as
      // the mapped value.
      dynamic: {
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
  // Value defined by a single mapping rule executing a method against a
  // previous output of the same mapping object.
  progressive: {
    $: {
      object: '$.lib._',
      method: 'toUpper',
      params: '$.output.bar[0].static',
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
    'arn:aws:dynamodb:us-east-1:*:table/*/stream/2023-05-19T12:57:41.682',
};

// This initializes a JsonMap instance.
const jsonMap = new JsonMap(map, lib);

describe('JsonMap', function () {
  it('simple case', async function () {
    const output = await jsonMap.transform(input);

    expect(output).to.deep.equal({
      bar: [
        {
          dynamic: '$0.70',
          static: 'another static value',
        },
      ],
      foo: 'static value passed directly to output',
      progressive: 'ANOTHER STATIC VALUE',
    });
  });
});
