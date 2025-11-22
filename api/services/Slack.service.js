import { SlackClient } from '#clients/Slack.client.js';

const SLACK_SALES_CHANNEL = process.env.SLACK_SALES_CHANNEL;

export async function sendVoiceAgentTrialNotification(
  user,
  durationMs,
  closingReason,
  conversationId
) {
  if (!SLACK_SALES_CHANNEL) {
    console.error('[SLACK] SLACK_SALES_CHANNEL env var is not set. Skipping notification.');
    return;
  }

  const { name, email } = user || {};

  const durationText = formatDuration(durationMs);
  const safeClosingReason = closingReason || 'Not specified';

  const blocks = [
    // Title
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*New Voice Agent Trial Call*',
      },
    },

    { type: 'divider' },

    // User details
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Name*\n${name || 'Unknown'}`,
        },
        {
          type: 'mrkdwn',
          text: `*Email*\n${email || 'Not provided'}`,
        },
      ],
    },

    { type: 'divider' },

    // Call details
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Duration*\n${durationText}`,
        },
        {
          type: 'mrkdwn',
          text: `*Closing Reason*\n${safeClosingReason}`,
        },
      ],
    },

    { type: 'divider' },

    // Footer
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `_Conversation ID: ${conversationId || 'N/A'}_`,
        },
      ],
    },
  ];

  try {
    await SlackClient.chat.postMessage({
      channel: SLACK_SALES_CHANNEL,
      text: 'New Voice Agent Trial Call',
      blocks,
    });
  } catch (err) {
    console.error('[SLACK] Failed to send voice agent trial notification:', err);
  }
}

function formatDuration(durationMs) {
  if (!durationMs || Number.isNaN(durationMs) || durationMs < 0) {
    return 'Unknown';
  }
  const totalSeconds = Math.round(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}
