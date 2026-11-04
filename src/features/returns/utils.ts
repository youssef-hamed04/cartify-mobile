import type { Order, OrderItem, ReturnRequest } from '@/api';

export const orderItemProductId = (item: OrderItem) =>
  typeof item.productId === 'string' ? item.productId : item.productId._id;

export const deliveredAt = (order: Order) =>
  [...order.statusHistory].reverse().find((h) => h.status === 'delivered')?.changedAt ?? order.updatedAt;

// A pending return's code works until expiresAt (the backend drops unlockCode once expired)
export const isActiveReturn = (r: ReturnRequest) => r.status === 'pending' && new Date(r.expiresAt) > new Date();

export const returnTitle = (r: ReturnRequest) => {
  const [first, ...rest] = r.items;
  if (!first) return 'Return';
  return rest.length ? `${first.name} +${rest.length} more` : first.name;
};

export const returnOrderRef = (r: ReturnRequest) =>
  r.orderId && typeof r.orderId === 'object' ? `Order #${r.orderId.randomId}` : 'Return';
