import { DDB } from '#clients/DynamoDb.client.js';
import { ENTITY_TABLE_NAME, GSI_ACTIVE_NAME } from '#Constants/DB.constants.js';
import { toIsoString } from '#common/timestamp.helper.js';

export async function transactCreateUserWithEmailGuard({ user }) {
  const now = new Date();
  const pk = `CATALOG#USER`;
  const sk = `USER#${user.userId}`;

  const userItem = {
    pk,
    sk,

    active_pk: pk,
    active_sk: sk,

    userId: user.userId,
    entityType: 'USER_INDEX',
    ...user,

    createdAt: toIsoString(now),
    updatedAt: toIsoString(now),
  };
  const emailKey = `USER#${user.email}`;
  const params = {
    TransactItems: [
      {
        Put: {
          TableName: ENTITY_TABLE_NAME,
          Item: userItem,
          ConditionExpression: 'attribute_not_exists(pk)',
        },
      },
      {
        Put: {
          TableName: ENTITY_TABLE_NAME,
          Item: {
            pk: emailKey,
            sk: `EMAIL_REGISTRY`,

            active_pk: emailKey,
            active_sk: `EMAIL_REGISTRY`,

            entityType: 'EMAIL_REGISTRY',
            userId: userItem.userId,
            createdAt: toIsoString(now),
            updatedAt: toIsoString(now),
          },
          ConditionExpression: 'attribute_not_exists(pk)',
        },
      },
    ],
  };

  return DDB.transactWrite(params).promise();
}

export async function transactCreateUserWithMobileGuard({ user }) {
  const now = new Date();
  const pk = `CATALOG#USER`;
  const sk = `USER#${user.userId}`;

  const userItem = {
    pk,
    sk,

    active_pk: pk,
    active_sk: sk,

    userId: user.userId,
    entityType: 'USER_INDEX',
    ...user,

    createdAt: toIsoString(now),
    updatedAt: toIsoString(now),
  };
  const mobileKey = `USER#${user.mobileNumber}`;
  const params = {
    TransactItems: [
      {
        Put: {
          TableName: ENTITY_TABLE_NAME,
          Item: userItem,
          ConditionExpression: 'attribute_not_exists(pk)',
        },
      },
      {
        Put: {
          TableName: ENTITY_TABLE_NAME,
          Item: {
            pk: mobileKey,
            sk: `MOBILE_REGISTRY`,

            active_pk: mobileKey,
            active_sk: `MOBILE_REGISTRY`,

            entityType: 'MOBILE_REGISTRY',
            userId: userItem.userId,
            createdAt: toIsoString(now),
            updatedAt: toIsoString(now),
          },
          ConditionExpression: 'attribute_not_exists(pk)',
        },
      },
    ],
  };

  return DDB.transactWrite(params).promise();
}

export async function getEmailRegistryByEmail(email) {
  const pk = `USER#${email}`;

  // We wrote exactly one item per email in sign-up, so query with pk and limit 1
  const params = {
    TableName: ENTITY_TABLE_NAME,
    IndexName: GSI_ACTIVE_NAME,
    KeyConditionExpression: '#pk = :pk',
    ExpressionAttributeNames: {
      '#pk': 'active_pk',
    },
    ExpressionAttributeValues: {
      ':pk': pk,
    },
    Limit: 1,
  };

  const { Items } = await DDB.query(params).promise();
  if (!Items || Items.length === 0) return null;

  // expected shape:
  // { pk: 'EMAIL#x@y.com', sk: 'USER#<userId>', userId: '<userId>', ... }
  return Items[0];
}

export async function getMobileRegistryByMobile(mobile) {
  const pk = `USER#${mobile}`;

  // We wrote exactly one item per email in sign-up, so query with pk and limit 1
  const params = {
    TableName: ENTITY_TABLE_NAME,
    IndexName: GSI_ACTIVE_NAME,
    KeyConditionExpression: '#pk = :pk',
    ExpressionAttributeNames: {
      '#pk': 'active_pk',
    },
    ExpressionAttributeValues: {
      ':pk': pk,
    },
    Limit: 1,
  };

  const { Items } = await DDB.query(params).promise();
  if (!Items || Items.length === 0) return null;

  return Items[0];
}

export async function getUserProfileById(userId) {
  if (!userId) return null;

  const params = {
    TableName: ENTITY_TABLE_NAME,
    IndexName: GSI_ACTIVE_NAME,
    KeyConditionExpression: '#pk = :pk and #sk = :sk',
    ExpressionAttributeNames: {
      '#pk': 'active_pk',
      '#sk': 'active_sk',
    },
    ExpressionAttributeValues: {
      ':pk': `CATALOG#USER`,
      ':sk': `USER#${userId}`,
    },
    Limit: 1,
  };

  const { Items } = await DDB.query(params).promise();
  if (!Items || Items.length === 0) return null;

  return Items[0];
}

export async function updateUser(userId, updates) {
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
    Key: {
      pk: 'CATALOG#USER',
      sk: `USER#${userId}`,
    },
    UpdateExpression: `SET ${sets.join(', ')}`,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
    ConditionExpression: 'attribute_exists(pk) AND attribute_exists(sk)',
    ReturnValues: 'ALL_NEW',
  };

  const data = await DDB.update(params).promise();
  return data.Attributes;
}

/**
 * getUsersByIds
 * - Accepts >100 ids (chunks into 100)
 * - Retries UnprocessedKeys with exponential backoff
 * - Optional: { consistentRead, projection }
 * - Returns results in the same order as input userIds
 * - Doesn't exclude deleted userIds.
 */
export async function getUsersByIds(userIds = [], opts = {}) {
  if (!userIds.length) return [];
  const { consistentRead = false, projection } = opts;

  // de-dupe while preserving order
  const seen = new Set();
  const deduped = [];
  for (const id of userIds) {
    if (!seen.has(id)) {
      seen.add(id);
      deduped.push(id);
    }
  }

  const chunks = chunk(deduped, 100);
  const allItems = [];

  for (const ids of chunks) {
    const keys = ids.map((id) => ({ pk: 'CATALOG#USER', sk: `USER#${id}` }));
    const params = {
      RequestItems: {
        [ENTITY_TABLE_NAME]: {
          Keys: keys,
          ...(projection
            ? {
                ProjectionExpression: projection,
              }
            : {}),
          ...(consistentRead ? { ConsistentRead: true } : {}),
        },
      },
    };

    const items = await batchGetWithRetry(params);
    allItems.push(...items);
  }

  // index by userId for re-ordering
  const byId = new Map(allItems.map((it) => [String(it.sk).replace(/^USER#/, ''), it]));

  // return in the same order as the original input (including duplicates)
  return userIds.map((id) => byId.get(id)).filter(Boolean);
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function batchGetWithRetry(initialParams, { maxRetries = 6 } = {}) {
  let params = JSON.parse(JSON.stringify(initialParams));
  let attempts = 0;
  const collected = [];

  while (attempts < maxRetries) {
    const res = await DDB.batchGet(params).promise();

    if (res.Responses && res.Responses[ENTITY_TABLE_NAME]) {
      collected.push(...res.Responses[ENTITY_TABLE_NAME]);
    }

    const unprocessed = res.UnprocessedKeys && res.UnprocessedKeys[ENTITY_TABLE_NAME];

    if (unprocessed && unprocessed.Keys && unprocessed.Keys.length) {
      attempts += 1;
      // backoff with jitter: 100ms * 2^attempts plus 0-100ms
      const delay = 100 * Math.pow(2, attempts) + Math.floor(Math.random() * 100);
      await sleep(delay);

      params = {
        RequestItems: {
          [ENTITY_TABLE_NAME]: unprocessed,
        },
      };
      continue;
    }

    break;
  }

  return collected;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
