import AWS from 'aws-sdk';

import dotenv from 'dotenv';
dotenv.config();

const ENV = process.env.ENV || 'local';

const baseConfig = {
  region: process.env.region,
};

const localConfig = {
  ...baseConfig,
  accessKeyId: process.env.accessKeyId,
  secretAccessKey: process.env.secretAccessKey,
  endpoint: process.env.endpoint,
};

const envConfigMap = {
  local: localConfig,
  prod: baseConfig,
  stage: baseConfig,
};

const awsConfig = envConfigMap[ENV];
AWS.config.update(awsConfig);

export default AWS;
