import { Check, Package, Truck, Undo2, X } from 'lucide-react-native';
import type { Order } from '@/api';
import { Pill } from '@/components/Misc';
import { orderStatusLabel } from '@/lib/format';
import { colors } from '@/theme';

// Status pill from "21 · Orders": icon 13 + label, tinted by state
export function OrderStatusPill({ order }: { order: Pick<Order, 'status' | 'products'> }) {
  const returning = order.products.some((p) => p.isRefundRequested);
  if (returning && order.status === 'delivered') {
    return <Pill label="Return in progress" icon={<Undo2 size={13} color={colors.warning} />} color={colors.warning} background={colors.warningBg} />;
  }
  switch (order.status) {
    case 'delivered':
      return <Pill label={orderStatusLabel.delivered} icon={<Check size={13} color={colors.success} />} color={colors.success} background={colors.successBg} />;
    case 'cancelled':
    case 'refunded':
      return <Pill label={orderStatusLabel[order.status]} icon={<X size={13} color={colors.danger} />} color={colors.danger} background={colors.dangerBg} />;
    case 'shipping':
      return <Pill label={orderStatusLabel.shipping} icon={<Truck size={13} color={colors.navy} />} />;
    default:
      return <Pill label={orderStatusLabel[order.status]} icon={<Package size={13} color={colors.navy} />} />;
  }
}

export const isActiveOrder = (o: Pick<Order, 'status'>) => ['placed', 'confirmed', 'shipping'].includes(o.status);

// Delivered orders can be returned while at least one item has no return yet
export const canReturn = (o: Pick<Order, 'status' | 'products'>) =>
  o.status === 'delivered' && o.products.some((p) => !p.isRefundRequested);
