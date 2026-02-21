import _ from 'lodash';
import numeral from 'numeral';
import { setTimeout } from 'timers/promises';
import { describe, expect, it } from 'vitest';

import { JsonMap } from './';

const lib = { _, numeral, setTimeout };

const map = {
  foo: 'static value passed directly to output',
  bar: [
    {
      static: 'another static value',
      $remove: 'this should be removed from the output',
      dynamic: {
        $: [
          {
            method: '$.lib._.get',
            params: ['$.input', 'dynamodb.NewImage.roundup.N'],
          },
          {
            method: '$.lib.numeral',
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

const input = {
  eventID: 'e560bbcaee919e16a6a8ce8dc3fe97ab',
  eventName: 'MODIFY',
  eventVersion: '1.1',
  eventSource: 'aws:dynamodb',
  awsRegion: 'us-east-1',
  dynamodb: {
    ApproximateCreationDateTime: 1685071094,
    Keys: {
      entityPK: { S: 'txn!' },
      entitySK: { S: 'txnId#_tQ72mu5Iy2PYJ33c497g' },
    },
    NewImage: {
      txnUserIdPK: { S: 'txn!|userId#Xmv51c7lYiiTIU22_UlCD' },
      created: { N: '1685071087846' },
      netValue: { N: '365.3' },
      methodId: { S: 'KDvC6leEzkAAf8-akh_vO' },
      entityPK: { S: 'txn!' },
      userId: { S: 'Xmv51c7lYiiTIU22_UlCD' },
      entitySK: { S: 'txnId#_tQ72mu5Iy2PYJ33c497g' },
      updater: { S: 'api-txn-v0-bali' },
      merchantId: { S: 'eQMZ2ikPmUd3cqrptbpna' },
      roundup: { N: '0.7' },
      txnMerchantIdPK: { S: 'txn!|merchantId#eQMZ2ikPmUd3cqrptbpna' },
      updated: { N: '1685071094685' },
      txnId: { S: '_tQ72mu5Iy2PYJ33c497g' },
      txnMethodIdPK: { S: 'txn!|methodId#KDvC6leEzkAAf8-akh_vO' },
    },
    OldImage: {
      txnUserIdPK: { S: 'txn!|userId#Xmv51c7lYiiTIU22_UlCD' },
      created: { N: '1685071087846' },
      netValue: { N: '429.74' },
      methodId: { S: 'KDvC6leEzkAAf8-akh_vO' },
      entityPK: { S: 'txn!' },
      userId: { S: 'Xmv51c7lYiiTIU22_UlCD' },
      entitySK: { S: 'txnId#_tQ72mu5Iy2PYJ33c497g' },
      updater: { S: 'api-txn-v0-bali' },
      merchantId: { S: 'eQMZ2ikPmUd3cqrptbpna' },
      roundup: { N: '0.26' },
      txnMerchantIdPK: { S: 'txn!|merchantId#eQMZ2ikPmUd3cqrptbpna' },
      updated: { N: '1685071087846' },
      txnId: { S: '_tQ72mu5Iy2PYJ33c497g' },
      txnMethodIdPK: { S: 'txn!|methodId#KDvC6leEzkAAf8-akh_vO' },
    },
    SequenceNumber: '31120900000000039175922358',
    SizeBytes: 801,
    StreamViewType: 'NEW_AND_OLD_IMAGES',
  },
  eventSourceARN:
    'arn:aws:dynamodb:us-east-1:*:table/*/stream/2023-05-19T12:57:41.682',
};

const jsonMap = new JsonMap(map, lib, { ignore: '^\\$(?!keep)' });

describe('JsonMap', () => {
  it('null case', async () => {
    const nullMap = new JsonMap(null, lib);
    const output = await nullMap.transform(null);
    expect(output).toBeNull();
  });

  it('empty case', async () => {
    const emptyMap = new JsonMap(
      {
        email: {
          $: [{ method: '$.lib._.get', params: ['$.input', 'email'] }],
        },
        phone: {
          $: [{ method: '$.lib._.get', params: ['$.input', 'phone'] }],
        },
      },
      lib,
    );

    const output1 = await emptyMap.transform(null);
    expect(output1).toEqual({});

    const output2 = await emptyMap.transform({ email: 'foo' });
    expect(output2).toEqual({ email: 'foo' });
  });

  it('simple case', async () => {
    const output = await jsonMap.transform(input);

    expect(output).toEqual({
      bar: [{ dynamic: '$0.70', static: 'another static value' }],
      foo: 'static value passed directly to output',
      progressive: 'ANOTHER STATIC VALUE',
      $keep:
        'this should NOT be removed from the output and the $ in the key should be unescaped',
    });
  });

  describe('real-world', () => {
    const rwInput = {
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

    it('distIdMap', async () => {
      const distIdMap = {
        $: {
          method: '$.lib._.get',
          params: ['$.input', 'dynamodb.NewImage.userId'],
        },
      };

      const { distId } = (await new JsonMap(
        { distId: distIdMap },
        lib,
      ).transform(rwInput)) as { distId: unknown };

      expect(distId).toBe('adKUH6fY9NVI3pwVDlyvu');
    });

    it('$ properties', async () => {
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

      const output = await new JsonMap(sourceMap, lib).transform(rwInput);

      expect(output).toEqual({
        merchant: { displayName: 'Test Merchant' },
      });
    });
  });
});
