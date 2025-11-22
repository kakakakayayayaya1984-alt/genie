import { toIsoString } from '#common/timestamp.helper.js';
import { OrderStatus, RequestStatus } from '#Constants/statuses.constants.js';
import { requestResponse } from '#presenters/request.js';
import { getMessagesByConversationIds } from '#repositories/Message.repository.js';
import * as requestRepo from '#repositories/Request.repository.js';
import * as roomRepo from '#repositories/Room.repository.js';
import * as staffRepo from '#repositories/Staff.repository.js';
import * as orderRepo from '#repositories/Order.repository.js';
import { ulid } from 'ulid';
import { placeOrder } from './Order.service.js';
import { updateOrderStatus } from '#repositories/Order.repository.js';
import { orderResponse } from '#presenters/order.js';
import { getAvailableStaff } from './Staff.service.js';

const minsToFulfillByDepartment = {
  house_keeping: () => {
    const { min, max } = { min: 25, max: 35 };
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  room_service: () => {
    const { min, max } = { min: 35, max: 45 };
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  front_office: () => {
    const { min, max } = { min: 5, max: 10 };
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  concierge: () => {
    const { min, max } = { min: 10, max: 20 };
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  facilities: () => {
    const { min, max } = { min: 20, max: 40 };
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  general_enquiry: () => {
    const { min, max } = { min: 3, max: 5 };
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
};

export async function listRequestsByBooking({ bookingId }) {
  const requests = await requestRepo.queryRequestsForBooking({ bookingId });

  const orders = await orderRepo.queryOrdersByBooking({ bookingId });
  const requestOrdersMap = new Map(orders.map((o) => [o.requestId, o]));

  return {
    items: requests.map((r) => ({
      ...requestResponse(r),
      order: orderResponse(requestOrdersMap.get(r.requestId)),
    })),
    count: requests.length,
  };
}

export async function createRequest(requestData) {
  const {
    hotelId,
    roomId,
    deviceId,
    bookingId,
    conversationId,
    guestUserId,
    department,
    priority,
    cart,
  } = requestData;

  let { details, requestType } = requestData;

  const minsToFulfillFn = minsToFulfillByDepartment?.[department];
  if (!minsToFulfillFn) {
    throw new Error(`unknown department ${department}`);
  }

  const now = new Date();
  const estimatedTimeOfFulfillment = toIsoString(
    now.setMinutes(now.getMinutes() + minsToFulfillFn())
  );

  const requestId = ulid();

  let order;
  if (cart) {
    order = await placeOrder({
      cart,
      hotelId,
      roomId,
      requestId,
      bookingId,
      guestUserId,
      estimatedTimeOfFulfillment,
    });
    const itemQuantities = [];
    const itemNames = [];

    for (const item of order.items) {
      itemQuantities.push(`${item.name} x ${item.quantity}`);
      itemNames.push(item.name);
    }

    details = `Guest has placed room service order for ${itemQuantities.join(', ')}`;
    requestType = `Order: ${itemNames.join(', ')}`;
  }

  const request = {
    entityType: 'REQUEST',
    requestId,
    hotelId,
    roomId,
    deviceId,
    bookingId,
    conversationId,
    guestUserId,

    department,
    requestType,
    details,
    priority,
    cart,

    status: RequestStatus.NEW,
    statusType: 'ACTIVE',

    estimatedTimeOfFulfillment,

    orderId: order?.orderId,
  };

  const availableStaff = await getAvailableStaff(request);
  if (availableStaff) {
    request.assignedStaffUserId = availableStaff;
  }

  const createdReq = await requestRepo.createRequest(request);
  createdReq.order = order;

  return createdReq;
}

async function enrichRequests({ hotelId, requests }) {
  const rooms = await roomRepo.queryAllRooms({ hotelId });
  const roomMap = new Map(rooms.map((room) => [room.roomId, room]));

  const staff = await staffRepo.queryStaffByHotelId(hotelId);
  const staffMap = new Map(staff.map((st) => [st.userId, st]));

  const conversationIds = requests?.map((r) => r.conversationId).filter(Boolean);
  const conversationsMap = await getMessagesByConversationIds(conversationIds);

  const getRoom = (room) =>
    room
      ? {
          type: room.type,
          floor: room.floor,
          number: room.number,
          roomId: room.roomId,
        }
      : null;

  const getStaff = (st) =>
    st
      ? {
          firstName: st.firstName,
          lastName: st.lastName,
          department: st.department,
          roles: st.roles,
        }
      : null;

  const getConversation = (c) =>
    c && c.length
      ? {
          messages: c.map(({ content, createdAt, messageId, role }) => ({
            content,
            createdAt,
            role,
            messageId,
          })),
        }
      : null;

  return requests.map((r) => ({
    ...requestResponse(r),
    room: getRoom(roomMap.get(r.roomId)),
    assignedStaff: getStaff(staffMap.get(r.assignedStaffUserId)),
    conversation: getConversation(conversationsMap.get(r.conversationId)),
  }));
}

export async function listRequestsByStatusType({ hotelId, statusType, limit, nextToken }) {
  if (!hotelId || !statusType) throw new Error('need hotelId and statusType to list requests');

  if (!['inactive', 'active'].includes(statusType.toLowerCase())) {
    throw new Error('invalid status type to list requests');
  }

  const requests = await requestRepo.queryRequestsByStatusType({
    hotelId,
    statusType,
    limit,
    nextToken,
  });

  return {
    ...requests,
    items: await enrichRequests({ hotelId, requests: requests.items }),
  };
}

export async function startRequest({
  requestId,
  hotelId,
  assignedStaffUserId,
  note,
  updatedByUserId,
}) {
  if (!requestId || !hotelId) throw new Error('requestId and hotelId needed to start request');

  const request = await requestRepo.getRequestById(requestId, hotelId);
  if (!request) throw new Error(`request doesn't exist for id:  ${requestId}`);

  if (!request.assignedStaffUserId && !assignedStaffUserId)
    throw new Error("require assignedStaffUserId for request that hasn't been auto assigned staff");

  const reqUpdate = await requestRepo.updateRequestStatusWithLog({
    request,
    toStatus:
      request.status === RequestStatus.DELAYED ? RequestStatus.DELAYED : RequestStatus.IN_PROGRESS, // if request is delayed, keep it in delayed
    assignedStaffUserId,
    updatedByUserId,
    note,
  });

  if (request.orderId) {
    await updateOrderStatus({
      hotelId,
      orderId: request.orderId,
      toStatus: OrderStatus.PREPARING,
    });
  }

  return reqUpdate;
}

export async function completeRequest({
  requestId,
  hotelId,
  assignedStaffUserId,
  note,
  updatedByUserId,
}) {
  if (!requestId || !hotelId) throw new Error('requestId and hotelId needed to complete request');

  const request = await requestRepo.getRequestById(requestId, hotelId);
  if (!request) throw new Error(`request doesn't exist for id:  ${requestId}`);

  const now = toIsoString();
  const reqUpdate = await requestRepo.updateRequestStatusWithLog({
    request,
    toStatus: RequestStatus.COMPLETED,
    assignedStaffUserId,
    timeOfFulfillment: now,
    updatedByUserId,
    note,
  });

  if (request.orderId) {
    await updateOrderStatus({
      hotelId,
      orderId: request.orderId,
      toStatus: OrderStatus.DELIVERED,
      timeOfFulfillment: now,
    });
  }

  return reqUpdate;
}

export async function cancelRequest({
  requestId,
  hotelId,
  cancellationReason,
  note,
  updatedByUserId,
}) {
  if (!requestId || !hotelId || !cancellationReason)
    throw new Error('requestId, hotelId and cancellationReason needed to cancel request');

  const request = await requestRepo.getRequestById(requestId, hotelId);
  if (!request) throw new Error(`request doesn't exist for id:  ${requestId}`);

  const reqUpdate = await requestRepo.updateRequestStatusWithLog({
    request,
    toStatus: RequestStatus.CANCELLED,
    cancellationReason,
    updatedByUserId,
    note,
  });

  if (request.orderId) {
    await updateOrderStatus({
      hotelId,
      orderId: request.orderId,
      toStatus: OrderStatus.CANCELLED,
    });
  }

  return reqUpdate;
}

export async function getActiveWorkloadByUser({ hotelId }) {
  const activeRequests = await requestRepo.queryRequestsByStatusType({
    hotelId,
    statusType: 'ACTIVE',
    limit: 500,
  });

  const workload = {};

  for (const req of activeRequests.items || []) {
    const assigneeId = req.assignedStaffUserId;
    if (!assigneeId) continue;
    workload[assigneeId] = (workload[assigneeId] || 0) + 1;
  }

  return workload;
}
