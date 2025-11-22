# api

## To run dynamodb locally

1. Make sure there's a `dynamodb-local-data` folder in the directory you're running this command
2. `mkdir -p dynamodb-local-data && chmod -R 777 dynamodb-local-data`

```sh
docker run --rm -p 8000:8000 -v /Users/adithyaprabhu/dynamodb-local-data:/home/dynamodblocal/data amazon/dynamodb-local -jar DynamoDBLocal.jar -sharedDb -dbPath /home/dynamodblocal/data
```

## To run `dynamodb-admin` web console to view local dynamodb

1. Install it first with `npm install -g dynamodb-admin`

```sh
AWS_REGION=ap-south-1 AWS_ACCESS_KEY_ID=local AWS_SECRET_ACCESS_KEY=local dynamodb-admin
```

## Create tables on `dynamodb-admin`

1. Table schemas are under `api/tables`
2. Create all tables in the web console

## Seed data

### GUESTS

```json
{
  "id": "LOGIN:Room Genie:chai",
  "hotelId": "Room Genie",
  "password": "$2b$10$haEIYUY8wEh5Ft526BkttOy66x4JM3nKd106F8Mmc4GeyqQMHSkx2",
  "username": "chai"
}
```

## Using local dynamodb when running api

1. In your `.env` file, update the following values for dynamodb config

```sh
# DYNAMO DB CONFIG
accessKeyId=local
secretAccessKey=local
region=ap-south-1
endpoint=http://localhost:8000
```

## Configuring AWS CLI

1. Get Access Key ID and Secret Access Key for an IAM
2. Run this on your terminal to configure `roommitra` profile - `aws configure --profile roommitra`
3. Enter the access key and secret.
4. Anytime you want to use terraform's roommitra IAM, run an `aws` command with `--profile roommitra`.

## SSM session to EC2
```sh
aws ssm start-session --target $(aws ec2 describe-instances --filters "Name=tag:Name,Values=roommitra-ec2" "Name=instance-state-name,Values=running" --query "Reservations[0].Instances[0].InstanceId" --output text)
```

## Certificate on the EC2

If you need to generate new certificates for EC

1. Start ssm session to EC2 using command above
2. Run `certbot` to generate certificates

```sh
sudo certbot --nginx -d roommitra.com -d api.roommitra.com -d app.roommitra.com -d app-stage.roommitra.com -d api-stage.roommitra.com --agree-tos -m chai@roommitra.com --redirect -n
```

3. Backup the certificates to S3

```sh
BUCKET="s3://roommitra-codedeploy/certs"
sudo tar --numeric-owner -C /etc -czf /root/letsencrypt-backup.tgz letsencrypt
sudo aws s3 cp /root/letsencrypt-backup.tgz $BUCKET/letsencrypt-$(date +%F).tgz
sudo aws s3 cp /root/letsencrypt-backup.tgz $BUCKET/letsencrypt-latest.tgz

```

## Deploying new code

- CodeDeploy isn't working right now.
- Until then, we have to copy the code to the EC2 and restart the `pm2` processes.
- Below are the steps for deploying `website`.
- Similar steps need to be followed for `EC2` and `webapp` services.

### Copying files into EC2

1. There's no SSH access to EC2.
2. Sync the files to S3 first

```sh
aws s3 sync ./website s3://roommitra-codedeploy/website --delete \
--exclude "node_modules/*" \
--exclude ".next/*" \
--exclude "*.log" \
--exclude ".git/*"
```

3. Then login to the EC2 using ssm.

```sh
aws ssm start-session --target i-0547ae1ad3fe5c2f1 --profile roommitra
```

4. Sync the files from S3 to EC2

```sh
  aws s3 sync s3://roommitra-codedeploy/website /opt/roommitra/website --delete
```

### Build

```sh
cd /opt/roommitra/website
npm install
npm run build
```

### Restart `pm2` process

1. Stop and delete `website`

```sh
sudo runuser -l appuser -c "pm2 delete website || true"
```

2. Start

```sh
sudo runuser -l appuser -c "cd /opt/roommitra/website && pm2 start 'PORT=3000 npm run start' --name website || true"
```

## Updating environment secrets

1. Define your production `.env.prod` file

```sh

```

2. Update ssm parameter with secret name `/roommitra/api/env`

```sh
aws ssm put-parameter \
  --name "/roommitra/api/env" \
  --type "SecureString" \
  --value "$(cat .env.prod)" \
  --overwrite
```

3. Redeploy `api` for the new secrets to take effect

### Note:

1. You can the existing environment file at `/roommitra/api/env` ssm parameter with this command

```sh
aws ssm get-parameter --name "/roommitra/api/env" --with-decryption --query "Parameter.Value" --output text
```

2. Do the same for `website` and `webapp`. Use ssm parameter name `/roommitra/api/website` and `/roommitra/api/webapp` respectively.


# Checking disk space on EC2
1. Check current disk usage
```sh
df -h /
```
2. To see all mounts
```sh
df -h
```
This shows total, used, and available space. Note the % used or Avail column.

3. Check which directories take the most space
```sh
sudo du -h -d1 / | sort -hr | head -20
```

4. To visualize it after say deploys
```sh
df -h > befoer.txt
# run deploy
df -h > after.txt
diff before.txt after.txt
```

```sh
sudo du -sh /* > before_dirs.txt
# run deploy
sudo du -sh /* > after_dirs.txt
diff before_dirs.txt after_dirs.txt
```


# Updating environment vars and secrets

1. Get the secret from aws paramters
```sh
aws ssm get-parameter --name "/roommitra/api-stage/env" --with-decryption --query "Parameter.Value" --output text > pp.txt
```
2. Update the variables in `pp.txt`. It's a `.env` file so follow the rules for writing a `.env` file. Example:
```sh
ENV=stage

MY_SECRET=verysecret

SO_SECRET=alsosecret

```
3. Write the updated `pp.txt` file to `ssm` parameter
```sh
aws ssm put-parameter --name "/roommitra/api-stage/env" --type "SecureString" --value "$(cat pp.txt)" --overwrite
```

### Note:
1. The parameter names available are `api`, `website`, `webapp` for production environments. `api-stage`, `webapp-stage` for stage environments.
2. You have to redeploy the docker image using the github actions ci/cd for the updated ssm parameter file to get set as environment vars in your container.

