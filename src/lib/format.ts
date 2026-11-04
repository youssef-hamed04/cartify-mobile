import type { OrderStatus, Product, ReturnReason, ReturnStatus } from '@/api';

export const money = (n: number | undefined | null) =>
  `$${(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const shortDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

export const dateTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';

export const timeAgo = (iso: string) => {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 172800) return 'Yesterday';
  return `${Math.floor(s / 86400)} days`;
};

export const productImage = (p?: Pick<Product, 'variants'> | null, color?: string) => {
  const v = (color && p?.variants.find((x) => x.color === color)) || p?.variants[0];
  return v?.images?.[0]?.url;
};

export const isNewArrival = (p: Product) => Date.now() - new Date(p.createdAt).getTime() < 30 * 86400_000;

export const orderStatusLabel: Record<OrderStatus, string> = {
  placed: 'Placed',
  confirmed: 'Confirmed',
  shipping: 'On the way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

export const returnStatusLabel: Record<ReturnStatus, string> = {
  pending: 'Awaiting drop-off',
  completed: 'Dropped at SmartBox',
  expired: 'Code expired',
  denied: 'Denied',
};

export const returnReasonLabel: Record<ReturnReason, string> = {
  changed_mind: 'Changed my mind',
  wrong_item: 'Not as described',
  defective: 'Arrived damaged',
  wrong_size: 'Wrong size',
  other: 'Something else',
};

export const GOVERNORATES = [
  'Cairo', 'Giza', 'Alexandria', 'Qalyubia', 'Dakahlia', 'Sharqia', 'Gharbia',
  'Ismailia', 'Suez', 'Port Said', 'Luxor', 'Aswan',
] as const;
