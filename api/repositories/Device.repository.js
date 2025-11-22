import { ENTITY_TABLE_NAME, GSI_ACTIVE_NAME } from '#Constants/DB.constants.js';
import { buildHotelEntityItem } from '#common/hotelEntity.helper.js';
import { DDB } from '#clients/DynamoDb.client.js';
import { toIsoString } from '#common/timestamp.helper.js';

export async function registerNewDevice(device) {
  const deviceItem = buildHotelEntityItem(device);

  const params = {
    TableName: ENTITY_TABLE_NAME,
    Item: deviceItem,
  };

  await DDB.put(params).promise();
  return params.Item;
}

export async function updateLastSeen({ hotelId, deviceId }) {
  const params = {
    TableName: ENTITY_TABLE_NAME,
    Key: {
      pk: `HOTEL#${hotelId}`,
      sk: `DEVICE#${deviceId}`,
    },

    UpdateExpression: `SET #lastSeen = :now, #updatedAt = :now`,
    ExpressionAttributeNames: {
      '#lastSeen': 'lastSeen',
      '#updatedAt': 'updatedAt',
    },
    ExpressionAttributeValues: {
      ':now': toIsoString(),
    },
    ConditionExpression: 'attribute_exists(pk) and attribute_exists(sk)',
    ReturnValues: 'ALL_NEW',
  };

  const { Attributes } = await DDB.update(params).promise();
  return Attributes;
}

export async function queryAllDevices({ hotelId }) {
  if (!hotelId) throw new Error('hotelId is required to query devices');

  const params = {
    TableName: ENTITY_TABLE_NAME,
    IndexName: GSI_ACTIVE_NAME,
    KeyConditionExpression: '#pk = :pk and begins_with(#sk, :sk)',
    ExpressionAttributeNames: { '#pk': 'active_pk', '#sk': 'active_sk' },
    ExpressionAttributeValues: {
      ':pk': `HOTEL#${hotelId}`,
      ':sk': `DEVICE#`,
    },

    ScanIndexForward: false,
  };

  const items = [];
  let lastEvaluatedKey;

  do {
    const res = await DDB.query(params).promise();
    if (res.Items?.length) items.push(...res.Items);
    lastEvaluatedKey = res.LastEvaluatedKey;
    params.ExclusiveStartKey = lastEvaluatedKey;
  } while (lastEvaluatedKey);

  return items;
}
