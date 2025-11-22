import { ENTITY_TABLE_NAME, GSI_ACTIVE_NAME } from '#Constants/DB.constants.js';
import { buildHotelEntityItem } from '#common/hotelEntity.helper.js';
import { DDB } from '#clients/DynamoDb.client.js';
import { decodeToken, encodeToken } from './repository.helper.js';
import { toIsoString } from '#common/timestamp.helper.js';

/**
 * Writes a Hotel entity.
 * Uses a conditional put so we do not overwrite an existing item accidentally.
 * Expects `hotel` to be a plain JS object with keys created in the service.
 */
export async function putHotel(hotel) {
  const hotelItem = buildHotelEntityItem(hotel);

  const params = {
    TransactItems: [
      {
        Put: {
          TableName: ENTITY_TABLE_NAME,
          Item: hotelItem,
          ConditionExpression: 'attribute_not_exists(pk) AND attribute_not_exists(sk)',
        },
      },
    ],
  };

  try {
    await DDB.transactWrite(params).promise();
  } catch (err) {
    // Bubble up a clearer message on conditional failures
    if (err && err.code === 'ConditionalCheckFailedException') {
      throw new Error('Hotel already exists with the same keys');
    }
    throw err;
  }
}

export async function queryAllHotels({ limit = 25, nextToken }) {
  const params = {
    TableName: ENTITY_TABLE_NAME,
    IndexName: GSI_ACTIVE_NAME,
    KeyConditionExpression: '#pk = :p',
    ExpressionAttributeNames: { '#pk': 'active_pk' },
    ExpressionAttributeValues: { ':p': 'CATALOG#HOTEL' },
    Limit: Math.min(Number(limit) || 25, 100),
    ScanIndexForward: false,
    ExclusiveStartKey: decodeToken(nextToken),
  };

  const data = await DDB.query(params).promise();
  return {
    items: data.Items || [],
    nextToken: encodeToken(data.LastEvaluatedKey),
    count: data.Count || 0,
  };
}

/** Query latest version of a hotel by id using pk and time-based sk */
export async function queryLatestHotelById(hotelId) {
  const pk = `CATALOG#HOTEL`;
  const sk = `HOTEL#${hotelId}`;

  const params = {
    TableName: ENTITY_TABLE_NAME,
    IndexName: GSI_ACTIVE_NAME,
    KeyConditionExpression: '#pk = :pk and #sk = :sk',
    ExpressionAttributeNames: { '#pk': 'active_pk', '#sk': 'active_sk' },
    ExpressionAttributeValues: { ':pk': pk, ':sk': sk },
    ScanIndexForward: false, // newest first
    Limit: 1,
  };

  const data = await DDB.query(params).promise();
  return data.Items && data.Items[0];
}

/** Update specific fields on a concrete pk/sk row */
export async function updateHotelByPkSk(pk, sk, updates) {
  const nowIso = new Date().toISOString();

  const names = { '#ua': 'updatedAt' };
  const values = { ':ua': nowIso };
  const sets = ['#ua = :ua'];

  let i = 0;
  for (const [k, v] of Object.entries(updates)) {
    i += 1;
    const nk = `#f${i}`;
    const vk = `:v${i}`;
    names[nk] = k;
    values[vk] = v;
    sets.push(`${nk} = ${vk}`);
  }

  const params = {
    TableName: ENTITY_TABLE_NAME,
    Key: { pk, sk },
    UpdateExpression: `SET ${sets.join(', ')}`,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
    ConditionExpression: 'attribute_exists(pk) AND attribute_exists(sk)',
    ReturnValues: 'ALL_NEW',
  };

  const data = await DDB.update(params).promise();
  return data.Attributes;
}

export async function queryLatestHotelByPrefix(hotelIdPrefix) {
  const pk = `CATALOG#HOTEL`;
  const sk = `HOTEL#${hotelIdPrefix.toUpperCase()}`;

  const params = {
    TableName: ENTITY_TABLE_NAME,
    IndexName: GSI_ACTIVE_NAME,
    KeyConditionExpression: '#pk = :pk and begins_with(#sk, :sk)',
    ExpressionAttributeNames: { '#pk': 'active_pk', '#sk': 'active_sk' },
    ExpressionAttributeValues: { ':pk': pk, ':sk': sk },
    ScanIndexForward: false, // newest first
    Limit: 1,
  };

  const data = await DDB.query(params).promise();
  return data.Items && data.Items[0];
}

export async function putAmenityOrConcierge(amenity) {
  const amenityItem = buildHotelEntityItem(amenity);
  const params = {
    TableName: ENTITY_TABLE_NAME,
    Item: amenityItem,
  };

  await DDB.put(params).promise();
  return params.Item;
}

export async function queryHotelMeta({ hotelId, entityType }) {
  if (!hotelId) {
    throw new Error('hotelId, entityType is required to query meta for hotel');
  }

  const params = {
    TableName: ENTITY_TABLE_NAME,
    IndexName: GSI_ACTIVE_NAME,
    KeyConditionExpression: '#pk = :pk AND begins_with(#sk, :sk)',
    ExpressionAttributeNames: {
      '#pk': 'active_pk',
      '#sk': 'active_sk',
    },
    ExpressionAttributeValues: {
      ':pk': `HOTEL#${hotelId}`,
      ':sk': `HOTEL#META#${entityType ? entityType + '#' : ''}`,
    },
    ScanIndexForward: false,
  };

  const items = [];
  let lastEvaluatedKey;

  try {
    do {
      const res = await DDB.query(params).promise();
      if (res.Items?.length) items.push(...res.Items);
      lastEvaluatedKey = res.LastEvaluatedKey;
      params.ExclusiveStartKey = lastEvaluatedKey;
    } while (lastEvaluatedKey);

    return items;
  } catch (err) {
    console.error('Failed to list meta for hotel:', err);
    throw new Error('Failed to list meta for hotel');
  }
}

export async function deleteHotelMeta({ hotelId, id, entityType }) {
  if (!hotelId || !id || !entityType) return null;

  const params = {
    TableName: ENTITY_TABLE_NAME,
    ConditionExpression: 'attribute_not_exists(deletedAt)',
    Key: {
      pk: `HOTEL#${hotelId}`,
      sk: `HOTEL#META#${entityType}#${id}`,
    },
    UpdateExpression: 'SET deletedAt = :now REMOVE active_pk, active_sk',
    ExpressionAttributeValues: { ':now': toIsoString() },
  };

  try {
    await DDB.update(params).promise();
  } catch (err) {
    console.error('Failed to delete hotel meta', err);
    throw new Error('Failed to delete hotel meta');
  }
}
