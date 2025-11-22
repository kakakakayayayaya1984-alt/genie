import { WebClient } from '@slack/web-api';

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

export const SlackClient = new WebClient(SLACK_BOT_TOKEN);
