import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import AWS from '#config/awsConfig.js';

export const DDB = new AWS.DynamoDB.DocumentClient({ convertEmptyValues: true });

const config = {
  region: process.env.region,
  credentials: process.env.accessKeyId
    ? {
        accessKeyId: process.env.accessKeyId,
        secretAccessKey: process.env.secretAccessKey,
      }
    : undefined,
};

const client = new DynamoDBClient(config);
export const DDBV3 = DynamoDBDocumentClient.from(client);
