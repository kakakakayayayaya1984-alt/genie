import { Department } from '#Constants/department.constants.js';
import { Priority } from '#Constants/priority.constants.js';
import { requestResponse } from '#presenters/request.js';
import { queryMenuByHotel } from '#repositories/Menu.repository.js';
import { validateCart } from '#services/Cart.service.js';
import { createRequest } from '#services/Request.service.js';
import express from 'express';

const router = express.Router();

router.get('/menu', async (req, res) => {
  const menu = await queryMenuByHotel({});

  res.status(200).json(menu);
});

router.post('/order', async (req, res) => {
  try {
    const { hotelId, roomId, deviceId } = req.deviceData;
    const guestUserId = req.headers['x-guest-user-id'];
    const bookingId = req.headers['x-booking-id'];

    if (!bookingId) {
      return res.status(400).json({ error: 'require bookingId to place order ' });
    }

    const { cart } = req.body;
    if (!cart || !cart?.items?.length) {
      return res.status(400).json({ error: 'cart with items needed to place order' });
    }

    const request = await createRequest({
      hotelId,
      roomId,
      deviceId,
      bookingId,
      guestUserId,

      department: Department.ROOM_SERVICE,
      priority: Priority.HIGH,
      cart,
    });

    return res.status(201).json(requestResponse(request));
  } catch (err) {
    console.error('Error placing order', err);
    if (err?.errors?.length)
      return res.status(500).json({ error: 'cart_validation_errors', errors: err?.errors });

    return res.status(500).json({ error: err?.message || 'Internal server error' });
  }

  // const now = new Date();
  // const twentyMinsLater = new Date().setMinutes(new Date().getMinutes + 20);
  // const bookingId = ulid();

  // res.status(200).json({
  //   requestId: ulid(),
  //   status: 'acknowledgeded',
  //   createdAt: toIsoString(now),
  //   estimatedTimeOfFulfillment: toIsoString(twentyMinsLater),
  //   department: 'Room Service',
  //   requestType: 'Breakfast',
  //   bookingId: bookingId,
  //   order: {
  //     orderId: ulid(),
  //     estimatedTimeOfFulfillment: toIsoString(twentyMinsLater),
  //     items: [
  //       {
  //         itemId: ulid(),
  //         name: 'Dosa',
  //         unitPrice: '15',
  //         quantity: 3,
  //         total: '45.00',
  //         image: {
  //           url: 'https://roommitra.com/room-mitra-logo.png',
  //         },
  //       },
  //       {
  //         itemId: ulid(),
  //         name: 'Idly',
  //         unitPrice: '15',
  //         quantity: 3,
  //         total: '45.00',
  //         image: {
  //           url: 'https://roommitra.com/room-mitra-logo.png',
  //         },
  //       },
  //     ],
  //     instruction: 'coffee without sugar',
  //     total: '200',
  //   },
  // });
});

export default router;
