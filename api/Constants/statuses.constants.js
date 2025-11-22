export const RequestStatus = {
  NEW: 'new',
  UNACKNOWLEDGED: 'unacknowledged',
  IN_PROGRESS: 'in_progress',
  DELAYED: 'delayed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const RequestStatuses = Object.values(RequestStatus);

export const ActiveRequestStatuses = [
  RequestStatus.NEW,
  RequestStatus.UNACKNOWLEDGED,
  RequestStatus.IN_PROGRESS,
  RequestStatus.DELAYED,
];

export const InActiveRequestStatuses = [RequestStatus.COMPLETED, RequestStatus.CANCELLED];

export const OrderStatus = {
  PENDING: 'pending',
  PREPARING: 'preparing',
  DELAYED: 'delayed',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  SCHEDULED: 'scheduled',
};

export const OrderStatuses = Object.values(OrderStatus);

export const ActiveOrderStatuses = [
  OrderStatus.PENDING,
  OrderStatus.PREPARING,
  OrderStatus.DELAYED,
];

export const InactiveOrderStatuses = [OrderStatus.CANCELLED, OrderStatus.DELIVERED];
