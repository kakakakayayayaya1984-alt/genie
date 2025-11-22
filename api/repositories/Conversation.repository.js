import { DDB } from '#clients/DynamoDb.client.js';
import { buildHotelEntityItem } from '#common/hotelEntity.helper.js';
import { ENTITY_TABLE_NAME } from '#Constants/DB.constants.js';

export async function saveConversationEntities(conversation, messages, conversationState) {
  const TransactItems = [];

  // 1) Upsert the conversation atomically using Update (Update acts as upsert in DynamoDB)
  if (conversation) {
    const conversationItem = buildHotelEntityItem(conversation);
    const { pk, sk, ...attrs } = conversationItem;

    // Build a dynamic SET expression for all attrs except pk/sk
    const ExpressionAttributeNames = {};
    const ExpressionAttributeValues = {};
    const sets = [];

    Object.entries(attrs).forEach(([key, value]) => {
      const nameKey = `#${key}`;
      const valueKey = `:${key}`;
      ExpressionAttributeNames[nameKey] = key;
      ExpressionAttributeValues[valueKey] = value;
      sets.push(`${nameKey} = ${valueKey}`);
    });

    // Ensure updatedAt gets touched (optional)
    ExpressionAttributeNames['#updatedAt'] = 'updatedAt';
    ExpressionAttributeValues[':updatedAt'] = new Date().toISOString();
    sets.push('#updatedAt = :updatedAt');

    TransactItems.push({
      Update: {
        TableName: ENTITY_TABLE_NAME,
        Key: { pk, sk },
        UpdateExpression: `SET ${sets.join(', ')}`,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
      },
    });
  }

  if (conversationState) {
    const { pk, sk, updatedAt, ...attrs } = conversationState;

    // Build a dynamic SET expression for all attrs except pk/sk
    const ExpressionAttributeNames = {};
    const ExpressionAttributeValues = {};
    const sets = [];

    Object.entries(attrs).forEach(([key, value]) => {
      const nameKey = `#${key}`;
      const valueKey = `:${key}`;
      ExpressionAttributeNames[nameKey] = key;
      ExpressionAttributeValues[valueKey] = value;
      sets.push(`${nameKey} = ${valueKey}`);
    });

    // Ensure updatedAt gets touched (optional)
    ExpressionAttributeNames['#updatedAt'] = 'updatedAt';
    ExpressionAttributeValues[':updatedAt'] = new Date().toISOString();
    sets.push('#updatedAt = :updatedAt');

    TransactItems.push({
      Update: {
        TableName: ENTITY_TABLE_NAME,
        Key: { pk, sk },
        UpdateExpression: `SET ${sets.join(', ')}`,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
      },
    });
  }

  // 2) Insert messages once (immutable/idempotent)
  messages.map(buildHotelEntityItem).forEach((mi) => {
    TransactItems.push({
      Put: {
        TableName: ENTITY_TABLE_NAME,
        Item: mi,
        ConditionExpression: 'attribute_not_exists(pk)',
      },
    });
  });

  return DDB.transactWrite({ TransactItems }).promise();
}
