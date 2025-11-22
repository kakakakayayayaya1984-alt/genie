import { ENTITY_TABLE_NAME, GSI_ACTIVE_NAME } from '#Constants/DB.constants.js';
import { DDB } from '#clients/DynamoDb.client.js';

/**
 * getMessagesByConversationIds
 * @param {string[]} conversationIds - array of ULIDs
 * @param {{ consistentRead?: boolean, projection?: string, concurrency?: number }} opts
 * @returns {Promise<Map<string, any[]>>}
 */
export async function getMessagesByConversationIds(conversationIds = [], opts = {}) {
  if (!conversationIds.length) return new Map();

  const { projection, concurrency = 8 } = opts;

  // de-dupe while preserving order
  const seen = new Set();
  const deduped = [];
  for (const id of conversationIds) {
    if (!seen.has(id)) {
      seen.add(id);
      deduped.push(id);
    }
  }

  // simple concurrency limiter
  const queue = [...deduped];
  const results = new Map();

  async function worker() {
    while (queue.length) {
      const id = queue.shift();
      const items = await queryAllForConversation(id, {
        projection,
        messagesOnly: true,
      });
      // sort by sk (MESSAGE#<ulid>) so it's chronological by ULID
      items.sort((a, b) => String(a.sk).localeCompare(String(b.sk)));
      results.set(id, items);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, deduped.length) }, () => worker());
  await Promise.all(workers);

  return results;
}

export async function queryAllForConversation(conversationId, { projection, messagesOnly }) {
  const items = [];
  let ExclusiveStartKey;

  const keyConditionExpressions = ['#pk = :pk'];
  const expressionAttributeNames = {
    '#pk': 'active_pk',
  };

  const expressionAttributeValues = {
    ':pk': `CONVERSATION#${conversationId}`,
  };

  if (messagesOnly) {
    keyConditionExpressions.push('begins_with(#sk, :sk)');
    expressionAttributeNames['#sk'] = 'active_sk';
    expressionAttributeValues[':sk'] = 'MESSAGE#';
  }

  do {
    const params = {
      TableName: ENTITY_TABLE_NAME,
      IndexName: GSI_ACTIVE_NAME,
      KeyConditionExpression: keyConditionExpressions.join(' AND '),
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ...(projection ? { ProjectionExpression: projection } : {}),
      ...(ExclusiveStartKey ? { ExclusiveStartKey } : {}),
    };

    const res = await DDB.query(params).promise();
    if (res.Items?.length) items.push(...res.Items);
    ExclusiveStartKey = res.LastEvaluatedKey;
  } while (ExclusiveStartKey);

  return items;
}
