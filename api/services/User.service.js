import bcrypt from 'bcrypt';
import { ulid } from 'ulid';
import * as UserRepo from '#repositories/User.repository.js';
import { ENTITY_TABLE_NAME } from '#Constants/DB.constants.js';
import { toIsoString } from '#common/timestamp.helper.js';
import { DDB } from '#clients/DynamoDb.client.js';

const SALT_ROUNDS = 12;

export async function signUp({ firstName, lastName, email, password }) {
  const normalizedEmail = String(email).trim().toLowerCase();
  const userId = ulid();

  const passwordHash = await hashPassword(password);

  const user = {
    entityType: 'USER',
    userId,
    firstName: String(firstName).trim(),
    lastName: String(lastName).trim(),
    email: normalizedEmail,
    passwordHash,
  };

  // This will also create a unique email registry item to prevent duplicates
  await UserRepo.transactCreateUserWithEmailGuard({ user });

  // Never return the hash

  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}

export async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

export async function updatePassword(userId, password) {
  const passwordHash = await hashPassword(password);

  const params = {
    TableName: ENTITY_TABLE_NAME,
    Key: {
      pk: `CATALOG#USER`,
      sk: `USER#${userId}`,
    },
    UpdateExpression: `SET #password = :password, #updatedAt = :now`,
    ExpressionAttributeNames: {
      '#password': 'passwordHash',
      '#updatedAt': 'updatedAt',
    },
    ExpressionAttributeValues: {
      ':password': passwordHash,
      ':now': toIsoString(),
    },
  };

  await DDB.update(params).promise();
}
