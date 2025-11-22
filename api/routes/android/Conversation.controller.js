import express from 'express';
import * as conversationService from '#services/Conversation.service.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { hotelId, roomId, deviceId, bookingId } = req.deviceData;
    const guestUserId = req.headers['x-guest-user-id'];

    const { conversationId, message } = req.body;
    if (!message || !bookingId || !guestUserId) {
      return res
        .status(400)
        .json({ error: 'Require bookingId, guestUserId, message for conversations' });
    }

    const conversationData = {
      hotelId,
      roomId,
      deviceId,
      bookingId,
      guestUserId,
      conversationId,
      userContent: message,
      isProspect: false,
    };

    const result = await conversationService.handleConversation(conversationData);

    return res.status(201).json(result);
  } catch (err) {
    console.error('Error adding to conversation', err);
    return res.status(500).json({ error: err?.message || 'Internal server error' });
  }
});

export default router;
