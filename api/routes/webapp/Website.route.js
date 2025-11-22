import express from 'express';
import multer from 'multer';
import { generateOtpForEmail, verifyOtpForEmail } from '#services/Otp.service.js';
import { OtpPurpose } from '#Constants/OtpPurpose.constants.js';
import { SlackClient } from '#clients/Slack.client.js';

const router = express.Router();

const SLACK_FEEDBACK_CHANNEL = process.env.SLACK_FEEDBACK_CHANNEL;
const SLACK_SALES_CHANNEL = process.env.SLACK_SALES_CHANNEL;
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

// store audio in memory for forwarding to Slack
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
});

// register lead
router.post('/leads', async (req, res) => {
  if (!SLACK_BOT_TOKEN) {
    return res.status(200).json({ ok: false, message: 'SLACK_BOT_TOKEN not set' });
  }

  try {
    const {
      name = '',
      email = '',
      phone = '',
      hotel = '',
      message = '',
      plan = '',
      monthlySalary = '',
      staffCount = '',
      automationPercent = '',
      dailyRoomRevenue = '',
      upsellPercent = '',
      market = '',
    } = req.body || {};

    // minimal validation
    if (!name.trim() || !email.trim()) {
      return res.status(400).json({ ok: false, error: 'name and email are required' });
    }

    // Slack payload - Blocks for neat formatting
    const textPlain = `New Room Mitra demo request from ${name}`;
    const blocks = [
      {
        type: 'header',
        text: { type: 'plain_text', text: '🛎️ New Demo Request', emoji: true },
      },
      { type: 'divider' },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Name*\n${name}` },
          { type: 'mrkdwn', text: `*Email*\n${email}` },
          { type: 'mrkdwn', text: `*Phone*\n${phone || '—'}` },
          { type: 'mrkdwn', text: `*Hotel*\n${hotel || '—'}` },
          ...(plan ? [{ type: 'mrkdwn', text: `*Plan*\n${plan || '—'}` }] : []),
          ...(monthlySalary
            ? [{ type: 'mrkdwn', text: `*Monthly Salary*\n${monthlySalary || '—'}` }]
            : []),
          ...(staffCount ? [{ type: 'mrkdwn', text: `*Staff Count*\n${staffCount || '—'}` }] : []),
          ...(automationPercent
            ? [{ type: 'mrkdwn', text: `*Automation Percent*\n${automationPercent || '—'}` }]
            : []),
          ...(dailyRoomRevenue
            ? [{ type: 'mrkdwn', text: `*Daily Room Revenue*\n${dailyRoomRevenue || '—'}` }]
            : []),
          ...(upsellPercent
            ? [{ type: 'mrkdwn', text: `*Upsell Percent*\n${upsellPercent || '—'}` }]
            : []),
          ...(market ? [{ type: 'mrkdwn', text: `*Market*\n${market || '—'}` }] : []),
        ],
      },
      ...(message
        ? [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Message*\n${message}`,
              },
            },
          ]
        : []),
      {
        type: 'context',
        elements: [{ type: 'mrkdwn', text: `Received: ${new Date().toLocaleString()}` }],
      },
    ];

    await SlackClient.chat.postMessage({
      channel: SLACK_SALES_CHANNEL,
      text: textPlain,
      blocks,
    });

    return res.json({ ok: true, message: 'Lead captured and sent to Slack' });
  } catch (err) {
    console.error('Lead submit failed', err);
    return res.status(500).json({ ok: false, error: 'Internal server error' });
  }
});

router.post('/feedback', upload.single('audio'), async (req, res) => {
  if (!SLACK_BOT_TOKEN) {
    return res.status(200).json({ ok: false, message: 'SLACK_BOT_TOKEN not set' });
  }

  try {
    const { name = '', roomNumber = '', message = '', rating = '', source = '' } = req.body || {};
    const audioFile = req.file; // from multer, field name: "audio"

    // Allow anonymous + audio-only feedback, but reject truly empty
    if (!message.trim() && !audioFile) {
      return res.status(400).json({ ok: false, error: 'Feedback message or audio is required' });
    }

    const displayName = name.trim() || 'Guest';
    const displayRoom = roomNumber.trim() || 'N/A';

    const textPlain = `New Room Mitra feedback from ${displayName} (Room ${displayRoom})`;

    const fields = [
      { type: 'mrkdwn', text: `*Name*\n${displayName}` },
      { type: 'mrkdwn', text: `*Room*\n${displayRoom}` },
    ];

    if (rating) {
      fields.push({
        type: 'mrkdwn',
        text: `*Rating*\n${rating}`,
      });
    }

    if (source) {
      fields.push({
        type: 'mrkdwn',
        text: `*Source*\n${source}`,
      });
    }

    const blocks = [
      {
        type: 'header',
        text: { type: 'plain_text', text: '⭐ Guest Feedback', emoji: true },
      },
      { type: 'divider' },
      {
        type: 'section',
        fields,
      },
    ];

    if (message.trim()) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Text feedback*\n${message}`,
        },
      });
    }

    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Received: ${new Date().toLocaleString()}`,
        },
      ],
    });

    // 1) Send main message via chat.postMessage
    await SlackClient.chat.postMessage({
      channel: SLACK_FEEDBACK_CHANNEL,
      text: textPlain,
      blocks,
    });

    // 2) Upload audio file (if any)
    if (audioFile) {
      try {
        await SlackClient.files.uploadV2({
          channel_id: SLACK_FEEDBACK_CHANNEL,
          initial_comment: `🎧 Voice feedback from ${displayName} (Room ${displayRoom})`,
          file_uploads: [
            {
              file: audioFile.buffer,
              filename: audioFile.originalname || 'feedback.ogg',
              title: 'Guest voice feedback',
            },
          ],
        });
      } catch (err) {
        console.error('Slack file upload failed', JSON.stringify(err));
      }
    }

    return res.json({ ok: true, message: 'Feedback captured and sent to Slack' });
  } catch (err) {
    console.error('Feedback submit failed', err);
    return res.status(500).json({ ok: false, error: 'Internal server error' });
  }
});

router.post('/voice-agent-trial-request', async (req, res) => {
  const { name, email, otp } = req.body || {};

  if (!email) {
    return res.status(400).json({ ok: false, error: 'Email is required' });
  }

  try {
    // Case 1: request OTP
    if (name && !otp) {
      await generateOtpForEmail(email, name, OtpPurpose.VOICE_AGENT_TRIAL_REQUEST);

      return res.json({
        message: 'Verification code sent to email',
      });
    }

    // Case 2: verify OTP
    if (otp && !name) {
      const token = await verifyOtpForEmail(email, otp, OtpPurpose.VOICE_AGENT_TRIAL_REQUEST);
      return res.json({
        token,
      });
    }

    // Bad payload
    return res.status(400).json({
      error: 'Provide either { name, email } to request an OTP, or { email, otp } to verify',
    });
  } catch (err) {
    console.error('Error in /voice-agent-trail-request', err);
    if (err.code === 'INVALID_CODE') {
      return res.status(400).json({
        error: 'Invalid or expired verification code',
      });
    }
    return res.status(500).json({
      error: err?.message || 'Internal server error',
    });
  }
});

export default router;
