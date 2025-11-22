import { PutCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { DDBV3 } from '#clients/DynamoDb.client.js';
import { ENTITY_TABLE_NAME, GSI_ACTIVE_NAME } from '#Constants/DB.constants.js';

export async function saveOTP(email, name, otp, ttl, purpose) {
  const pk = `OTP#${email}`;
  const sk = `${purpose}#CODE#${otp}`;
  const otpItem = {
    pk,
    sk,
    active_pk: pk,
    active_sk: sk,
    email,
    name,
    code: otp,
    purpose,
    createdAt: new Date().toISOString(),
    ttl,
  };

  const item = await DDBV3.send(
    new PutCommand({
      TableName: ENTITY_TABLE_NAME,
      Item: otpItem,
    })
  );

  return item;
}

export async function getOtp(email, code, purpose) {
  const resp = await DDBV3.send(
    new QueryCommand({
      TableName: ENTITY_TABLE_NAME,
      IndexName: GSI_ACTIVE_NAME,
      KeyConditionExpression: '#pk = :p AND #sk = :s',
      ExpressionAttributeNames: {
        '#pk': 'active_pk',
        '#sk': 'active_sk',
      },
      ExpressionAttributeValues: {
        ':p': `OTP#${email}`,
        ':s': `${purpose}#CODE#${code}`,
      },
    })
  );

  const items = resp.Items;
  return items && items.length > 0 ? items[0] : null;
}

export async function deleteOtp(email, code, purpose) {
  const pk = `OTP#${email}`;
  const sk = `${purpose}#CODE#${code}`;
  const params = {
    TableName: ENTITY_TABLE_NAME,
    Key: {
      pk,
      sk,
    },
    UpdateExpression: 'SET deletedAt = :now REMOVE active_pk, active_sk',
    ExpressionAttributeValues: {
      ':now': new Date().toISOString(),
    },
  };
  await DDBV3.send(new UpdateCommand(params));
}
