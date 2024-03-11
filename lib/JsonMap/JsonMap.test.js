/* eslint-env mocha */

// npm imports
import { expect } from 'chai';
import _ from 'lodash';
import numeral from 'numeral';
import { JsonMap } from '../index.js';
import { setTimeout } from 'timers/promises';

const lib = { _, numeral, setTimeout };

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
  $keep:
    'this should NOT be removed from the output and the $ in the key should be unescaped',
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
const jsonMap = new JsonMap(map, lib, { ignore: '^\\$(?!keep)' });

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
      $keep:
        'this should NOT be removed from the output and the $ in the key should be unescaped',
    });
  });

  describe('real-world', function () {
    const input = {
      eventID: 'e6f852335291638bc6d7694fd6cd6d43',
      eventName: 'INSERT',
      eventVersion: '1.1',
      eventSource: 'aws:dynamodb',
      awsRegion: 'us-east-1',
      dynamodb: {
        ApproximateCreationDateTime: 1692803882,
        Keys: {
          entityPK: 'txn!',
          entitySK: 'txnId#4DUg8FpqDIhar0urPe2re',
        },
        NewImage: {
          txnUserIdPK: 'txn!|userId#adKUH6fY9NVI3pwVDlyvu',
          created: 1692803881313,
          netValue: 734.57,
          discount: 110.19,
          methodId: 'nC9F3Q-uYlpq2tRwmH6D0',
          entityPK: 'txn!',
          userId: 'adKUH6fY9NVI3pwVDlyvu',
          entitySK: 'txnId#4DUg8FpqDIhar0urPe2re',
          updater: 'api-txn-v0-bali',
          merchantId: 'Wiv3gysXfAWj4ghMw5FK6',
          offerId: 'jTcAsBO2Qu9U39ZzP1nVr',
          roundup: 0.43,
          txnMerchantIdPK: 'txn!|merchantId#Wiv3gysXfAWj4ghMw5FK6',
          txnOfferIdPK: 'txn!|offerId#jTcAsBO2Qu9U39ZzP1nVr',
          updated: 1692803881313,
          txnId: '4DUg8FpqDIhar0urPe2re',
          txnMethodIdPK: 'txn!|methodId#nC9F3Q-uYlpq2tRwmH6D0',
        },
        SequenceNumber: '223674400000000015078802223',
        SizeBytes: 510,
        StreamViewType: 'NEW_AND_OLD_IMAGES',
      },
      eventSourceARN:
        'arn:aws:dynamodb:us-east-1:546652796775:table/api-txn-v0-bali/stream/2023-07-07T12:46:31.959',
    };

    it('distIdMap', async function () {
      const distIdMap = {
        $: {
          method: '$.lib._.get',
          params: ['$.input', 'dynamodb.NewImage.userId'],
        },
      };

      const { distId } = await new JsonMap(
        { distId: distIdMap },
        lib
      ).transform(input);

      expect(distId).to.equal('adKUH6fY9NVI3pwVDlyvu');
    });

    it('$ properties', async function () {
      const sourceMap = {
        $privateGetMerchantParams: {
          merchantId: {
            $: {
              method: '$.lib._.get',
              params: ['$.input', 'dynamodb.NewImage.merchantId'],
            },
          },
        },
        $privateGetMerchantResponse: {
          data: [
            {
              merchantId: {
                $: [
                  { method: '$.lib.setTimeout', params: 1000 },
                  {
                    method: '$.lib._.get',
                    params: [
                      '$.output.$privateGetMerchantParams',
                      'merchantId',
                    ],
                  },
                ],
              },
              displayName: 'Test Merchant',
            },
          ],
        },
        merchant: {
          displayName: {
            $: {
              method: '$.lib._.get',
              params: [
                '$.output.$privateGetMerchantResponse',
                'data[0].displayName',
              ],
            },
          },
        },
      };

      const output = await new JsonMap(sourceMap, lib).transform(input);

      expect(output).to.deep.equal({
        merchant: { displayName: 'Test Merchant' },
      });
    });
  });
});
