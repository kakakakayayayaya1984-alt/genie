import { DDB } from '#clients/DynamoDb.client.js';
import { buildHotelEntityItem } from '#common/hotelEntity.helper.js';
import {
  ENTITY_TABLE_NAME,
  GSI_BOOKINGTYPE_NAME,
  GSI_STATUS_NAME,
} from '#Constants/DB.constants.js';
import { ActiveOrderStatuses, InactiveOrderStatuses } from '#Constants/statuses.constants.js';
import { decodeToken, encodeToken } from './repository.helper.js';

export async function createOrder({ order }) {
  const orderEntity = buildHotelEntityItem(order);

  const params = {
    TableName: ENTITY_TABLE_NAME,
    Item: orderEntity,
    ConditionExpression: 'attribute_not_exists(pk) and attribute_not_exists(sk)',
  };

  await DDB.put(params).promise();

  return params.Item;
}

export async function queryOrdersByStatusType({ hotelId, statusType, limit = 25, nextToken }) {
  if (!hotelId || !statusType)
    throw new Error('hotelId and statusType needed to query requests by status');

  const params = {
    TableName: ENTITY_TABLE_NAME,
    IndexName: GSI_STATUS_NAME,
    KeyConditionExpression: '#pk = :pk',
    ExpressionAttributeNames: {
      '#pk': 'status_pk',
    },
    ExpressionAttributeValues: {
      ':pk': `ORDERSTATUS#${statusType.toUpperCase()}#HOTEL#${hotelId}`,
    },
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

export async function updateOrderStatus({ orderId, hotelId, toStatus, timeOfFulfillment }) {
  if (!orderId || !toStatus)
    throw new Error('orderId, toStatus are required to update order status');

  const nowIso = new Date().toISOString();

  const statusType = ActiveOrderStatuses.includes(toStatus)
    ? 'ACTIVE'
    : InactiveOrderStatuses.includes(toStatus)
      ? 'INACTIVE'
      : 'UNKNOWN';

  const updateNames = {
    '#status': 'status',
    '#updatedAt': 'updatedAt',
    '#status_pk': 'status_pk',
    '#statusType': 'statusType',
  };

  const updateValues = {
    ':toStatus': toStatus,
    ':updatedAt': nowIso,
    ':status_pk': `ORDERSTATUS#${statusType}#HOTEL#${hotelId}`,
    ':statusType': statusType,
  };

  const updateExpressionFields = [
    '#status = :toStatus',
    '#updatedAt = :updatedAt',
    '#status_pk = :status_pk',
    '#statusType = :statusType',
  ];

  // only add this when a value is provided (null is OK, undefined is not)
  if (timeOfFulfillment !== undefined) {
    updateNames['#timeOfFulfillment'] = 'timeOfFulfillment';
    updateValues[':timeOfFulfillment'] = timeOfFulfillment; // can be a string or null
    updateExpressionFields.push('#timeOfFulfillment = :timeOfFulfillment');
  }

  const params = {
    TableName: ENTITY_TABLE_NAME,
    Key: {
      pk: `HOTEL#${hotelId}`,
      sk: `ORDER#${orderId}`,
    },
    UpdateExpression: `SET ${updateExpressionFields.join(', ')}`,
    ExpressionAttributeNames: updateNames,
    ExpressionAttributeValues: updateValues,
    // ensure the main item exists
    ConditionExpression: 'attribute_exists(pk) AND attribute_exists(sk)',
  };

  await DDB.update(params).promise();
  return {
    orderId,
    toStatus,
    updatedAt: nowIso,
  };
}

export async function queryOrdersByBooking({ bookingId }) {
  if (!bookingId) throw new Error('cannot query orders without bookingId');

  const params = {
    TableName: ENTITY_TABLE_NAME,
    IndexName: GSI_BOOKINGTYPE_NAME,
    KeyConditionExpression: '#pk = :pk and begins_with(#sk, :sk)',
    ExpressionAttributeNames: {
      '#pk': 'bookingType_pk',
      '#sk': 'bookingType_sk',
    },
    ExpressionAttributeValues: {
      ':pk': `BOOKING#${bookingId}`,
      ':sk': 'ORDER#',
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
    console.error('Failed to list orders for booking', err);
    throw new Error('Failed to list orders for booking');
  }
}
