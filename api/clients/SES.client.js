import { SESClient } from '@aws-sdk/client-ses';

const config = {
  region: process.env.region,
  // If running on EC2/Lambda/ECS with a role, you can omit credentials here;
  // the SDK will pick up IAM role credentials automatically.
  credentials: process.env.accessKeyId
    ? {
        accessKeyId: process.env.accessKeyId,
        secretAccessKey: process.env.secretAccessKey,
      }
    : undefined,
};

const SES = new SESClient(config);
export default SES;
