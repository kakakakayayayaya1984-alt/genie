import { ENTITY_TABLE_NAME, GSI_ACTIVE_NAME, GSI_ROOMTYPE_NAME } from '#Constants/DB.constants.js';
import { buildHotelEntityItem } from '#common/hotelEntity.helper.js';
import { toIsoString } from '#common/timestamp.helper.js';
import { DDB } from '#clients/DynamoDb.client.js';
import { decodeToken, encodeToken } from './repository.helper.js';

export async function existsOverlappingBooking({ roomId, checkInTime, checkOutTime }) {
  // Overlap condition:
  // existing.start < requested.end AND existing.end > requested.start
  const params = {
    TableName: ENTITY_TABLE_NAME,
    IndexName: GSI_ROOMTYPE_NAME,
    KeyConditionExpression: '#gpk = :gpk AND begins_with(#gsk, :bookingPrefix)',
    FilterExpression: '#checkInTime < :reqEnd AND #checkOutTime > :reqStart',
    ExpressionAttributeNames: {
      '#gpk': 'roomType_pk',
      '#gsk': 'roomType_sk',
      '#checkInTime': 'checkInTime',
      '#checkOutTime': 'checkOutTime',
    },
    ExpressionAttributeValues: {
      ':gpk': `ROOM#${roomId}`, // important prefix
      ':bookingPrefix': 'BOOKING#', // optional but narrows items on the index
      ':reqStart': checkInTime, // ISO strings compare lexicographically by time
      ':reqEnd': checkOutTime,
    },
    // Do NOT set Limit with a FilterExpression
    ProjectionExpression: '#checkInTime, #checkOutTime',
    ReturnConsumedCapacity: 'NONE',
  };

  let LastEvaluatedKey;
  do {
    const res = await DDB.query({ ...params, ExclusiveStartKey: LastEvaluatedKey }).promise();
    if (res.Items && res.Items.length > 0) return true; // Items are already filtered
    LastEvaluatedKey = res.LastEvaluatedKey;
  } while (LastEvaluatedKey);

  return false;
}

export async function createBooking(booking) {
  const bookingItem = buildHotelEntityItem(booking);

  await DDB.put({
    TableName: ENTITY_TABLE_NAME,
    Item: bookingItem,
    ConditionExpression: 'attribute_not_exists(pk) and attribute_not_exists(sk)',
  }).promise();

  return bookingItem;
}

export async function queryLatestBookingById({ hotelId, bookingId }) {
  const pk = `HOTEL#${hotelId}`;
  const sk = `BOOKING#${bookingId}`;

  const params = {
    TableName: ENTITY_TABLE_NAME,
    IndexName: GSI_ACTIVE_NAME,
    KeyConditionExpression: '#pk = :pk and #sk = :sk',
    ExpressionAttributeNames: { '#pk': 'active_pk', '#sk': 'active_sk' },
    ExpressionAttributeValues: { ':pk': pk, ':sk': sk },
    ScanIndexForward: false,
    Limit: 1,
  };

  const data = await DDB.query(params).promise();
  return data.Items && data.Items[0];
}
// TODO: change this to use status_pk and status_sk and GSI_Status
export async function queryBookings({ hotelId, status, limit = 25, nextToken, roomId }) {
  if (!hotelId) {
    throw new Error('hotelId is required to query active bookings');
  }

  if (!['all', 'active', 'upcoming', 'past'].includes(status)) {
    throw new Error('status needs to be one of all, active, upcoming or past');
  }

  const statusFilterExpression = {
    active: 'checkOutTime > :now AND checkInTime < :now',
    upcoming: 'checkInTime > :now',
    past: 'checkOutTime < :now',
  };

  const params = {
    TableName: ENTITY_TABLE_NAME,
    IndexName: GSI_ACTIVE_NAME,
    KeyConditionExpression: '#pk = :pk and begins_with(#sk, :sk)',
    FilterExpression: statusFilterExpression[status],
    ExpressionAttributeNames: { '#pk': 'active_pk', '#sk': 'active_sk' },
    ExpressionAttributeValues: {
      ':pk': `HOTEL#${hotelId}`,
      ':sk': `BOOKING#`,
      ':now': toIsoString(),
    },
    Limit: Math.min(Number(limit) || 25, 100),
    ScanIndexForward: false,
    ExclusiveStartKey: decodeToken(nextToken),
  };

  if (roomId) {
    params.FilterExpression = `${params.FilterExpression} and #roomId = :roomId`;
    params.ExpressionAttributeNames['#roomId'] = 'roomId';
    params.ExpressionAttributeValues[':roomId'] = roomId;
  }

  const data = await DDB.query(params).promise();
  return {
    items: data.Items || [],
    nextToken: encodeToken(data.LastEvaluatedKey),
    count: data.Count || 0,
  };
}

export async function getActiveBookingForRoom({ roomId }) {
  if (!roomId) {
    throw new Error('roomId required to query active booking for room');
  }

  const params = {
    TableName: ENTITY_TABLE_NAME,
    IndexName: GSI_ROOMTYPE_NAME,
    KeyConditionExpression: 'roomType_pk = :pk and begins_with(roomType_sk, :sk)',
    FilterExpression: 'checkInTime < :now AND :now < checkOutTime',
    ExpressionAttributeValues: {
      ':pk': `ROOM#${roomId}`,
      ':sk': 'BOOKING#',
      ':now': toIsoString(),
    },
  };

  const data = await DDB.query(params).promise();
  return data.Items && data.Items[0];
}

export async function deleteBooking({ hotelId, bookingId }) {
  if (!hotelId || !bookingId) throw new Error('need hoteId and bookingId to delete room');

  const params = {
    TableName: ENTITY_TABLE_NAME,
    ConditionExpression: 'attribute_not_exists(deletedAt)',
    Key: {
      pk: `HOTEL#${hotelId}`,
      sk: `BOOKING#${bookingId}`,
    },
    UpdateExpression: `SET deletedAt = :now REMOVE active_pk, active_sk, roomType_pk, roomType_sk`,
    ExpressionAttributeValues: { ':now': toIsoString() },
  };

  try {
    await DDB.update(params).promise();
  } catch (err) {
    console.error('failed to delete booking', err);
    throw new Error('failed to delete booking');
  }
}
