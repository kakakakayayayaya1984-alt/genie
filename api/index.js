import { getReqId, requestContext } from './middleware/requestContext.js';

// Patch console methods to include request ID if available
for (const k of ['log', 'info', 'warn', 'error']) {
  const orig = console[k].bind(console);
  console[k] = (...args) => {
    const id = getReqId();
    return id ? orig(`[${id}]`, ...args) : orig(...args);
  };
}

import cors from 'cors';
import express from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import cron from 'node-cron';
import { WebSocketServer } from 'ws';
import http from 'http';
import url from 'url';
import jwt from 'jsonwebtoken';

// import swaggerUi from 'swagger-ui-express';
// import swaggerJsdoc from 'swagger-jsdoc';

// routes
import bookingRoutes from '#routes/webapp/Booking.controller.js';
import staffRoutes from '#routes/webapp/Staff.controller.js';
import loginRoutes from '#routes/webapp/Login.controller.js';
import userRoutes from '#routes/webapp/User.controller.js';
import websiteRoutes from '#routes/webapp/Website.route.js';
import roomRoutes from '#routes/webapp/Room.controller.js';
import requestRoutes from '#routes/webapp/Request.controller.js';
import hotelRoutes from '#routes/webapp/Hotel.controller.js';
import imageRoutes from '#routes/webapp/Image.controller.js';
import orderRoutes from '#routes/webapp/Order.controller.js';

//Android Routes
import androidLoginRoutes from '#routes/android/Login.controller.js';
import androidRequestRoutes from '#routes/android/Request.controller.js';
import androidEventsTrackerRoutes from '#routes/android/EventTracker.controller.js';
import androidHotelRoutes from '#routes/android/Hotel.controller.js';
import androidRestaurantRoutes from '#routes/android/Restaurant.controller.js';
import androidConversationRoutes from '#routes/android/Conversation.controller.js';

// Middlewares
import authenticator from '#middleware/Authenticator.middleware.js';
import androidAuthenticator from '#middleware/AndroidAuthenticator.middleware.js';
import adminAuthenticator from '#middleware/AdminAuthenticator.middleware.js';

// Admin Routes
import adminHotelRoutes from '#routes/admin/Hotel.controller.js';
import adminStaffRoutes from '#routes/admin/Staff.controller.js';

// Socket controller
import { connection } from '#routes/Socket.controller.js';

// Cron jobs
import { checkDelayedRequests } from '#tasks/checkDelayedRequests.task.js';

const app = express();
const server = http.createServer(app);

// WebSocket server setup
const wss = new WebSocketServer({ noServer: true });

app.use(requestContext);

app.use(
  morgan((tokens, req, res) =>
    JSON.stringify({
      t: tokens.date(req, res, 'iso'),
      id: req.id,
      method: tokens.method(req, res),
      url: tokens.url(req, res),
      status: Number(tokens.status(req, res)),
      'resp-ms': Number(tokens['response-time'](req, res)),
      'content-length': Number(tokens.res(req, res, 'content-length') || 0),
      ref: tokens.referrer(req, res),
      ua: tokens['user-agent'](req, res),
    })
  )
);

// use env var, fallback to 3000
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3002',
      'https://roommitra.com',
      'https://app.roommitra.com',
      'https://app-stage.roommitra.com',
    ],
  })
);

// UI routes
app.use('/requests', authenticator, requestRoutes);
app.use('/booking', authenticator, bookingRoutes);
app.use('/rooms', authenticator, roomRoutes);
app.use('/staff', authenticator, staffRoutes);
app.use('/hotel', authenticator, hotelRoutes);
app.use('/image', authenticator, imageRoutes);
app.use('/orders', authenticator, orderRoutes);

// Android Routes
app.use('/android/login', androidLoginRoutes);
app.use('/android/requests', androidAuthenticator, androidRequestRoutes);
app.use('/android/hotel', androidAuthenticator, androidHotelRoutes);
app.use('/android/track-events', androidAuthenticator, androidEventsTrackerRoutes);
app.use('/android/restaurant', androidAuthenticator, androidRestaurantRoutes);
app.use('/android/conversations', androidAuthenticator, androidConversationRoutes);

// routes which dont need auth
app.use('/user', userRoutes);
app.use('/login', loginRoutes);
app.use('/website', websiteRoutes);

// -------------------------
// Admin Routes
// -------------------------
app.use('/admin/hotels', adminAuthenticator, adminHotelRoutes);
app.use('/admin/staff', adminAuthenticator, adminStaffRoutes);

// --- Health check endpoint ---
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// --- Health check endpoint ---
app.get('/android/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

server.on('upgrade', function upgrade(request, socket, head) {
  const { query, pathname } = url.parse(request.url, true);

  const token = query.token;

  if (!token) {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }

  try {
    request.user = jwt.verify(token, process.env.SECRET_KEY);
  } catch (err) {
    // Could be expired, malformed, etc.
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }

  // Check if the request is destined for the root WebSocket path
  if (pathname === '/') {
    // Use the handleUpgrade function to pass control to the ws server
    wss.handleUpgrade(request, socket, head, function done(ws) {
      wss.emit('connection', ws, request);
    });
  } else {
    // If the path is wrong, close the socket and return a 404 (though the client often sees a connection failure first)
    socket.destroy();
  }
});

// --- WebSocket Handler ---
wss.on('connection', connection);

cron.schedule('*/2 * * * *', () => {
  checkDelayedRequests();
});

server.listen(PORT, () => console.log(`Server running on port: http://localhost:${PORT}`));
