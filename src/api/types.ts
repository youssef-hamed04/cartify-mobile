// Shapes returned by the Cartify backend (cartify-backend-mqtt-main)

export interface ProductImage { url: string; publicId?: string }

export interface Variant {
  color: string;
  colorHex?: string;
  images: ProductImage[];
  stock: number;
  reserved: number;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  discount: number;
  raise: number;
  finalPrice: number;
  totalStock: number;
  category: string;
  brand?: string;
  tags?: string[];
  variants: Variant[];
  rating: { average: number; count: number };
  isFeatured: boolean;
  createdAt: string;
}

export interface Paginated { page: number; limit: number; total: number; totalPages: number }

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: { url?: string };
  icon?: string;
  bannerText?: string;
  productCount: number;
}

export interface Review {
  _id: string;
  rating: number;
  title?: string;
  body?: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
  userId?: { _id: string; firstName?: string; lastName?: string; avatar?: string } | null;
}

export interface CartItem {
  productId: Product | null; // null when the product was deleted
  quantity: number;
  color: string;
  priceSnapshot?: number;
}

export interface CartResponse { cart: { items: CartItem[] }; subtotal: number; totalQuantity: number }

export interface AddToCartResponse extends Partial<CartResponse> {
  stockLimitReached?: boolean;
  available?: number;
}

export interface WishlistItem { productId: Product | null; addedAt: string }

export type OrderStatus = 'placed' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled' | 'refunded';
export type PaymentMethod = 'cash' | 'credit_card' | 'instaPay' | 'vodafoneCash';

export interface OrderItem {
  productId: string | { _id: string; name: string; variants?: Variant[] };
  name: string;
  color: string;
  imageUrl?: string;
  quantity: number;
  unitPrice: number;
  isRefundRequested?: boolean;
}

export interface Order {
  _id: string;
  orderNumber: number;
  randomId: string;
  products: OrderItem[];
  subtotal: number;
  shippingCost: number;
  totalPrice: number;
  status: OrderStatus;
  statusHistory: { status: OrderStatus; changedAt: string; note?: string }[];
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  governorate: string;
  paymentMethod: PaymentMethod;
  isPaid: boolean;
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderInput {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  governorate: string;
  paymentMethod?: PaymentMethod;
  notes?: string;
}

export type ReturnReason = 'defective' | 'wrong_size' | 'changed_mind' | 'wrong_item' | 'other';
export type ReturnStatus = 'pending' | 'completed' | 'expired' | 'denied';

export interface ReturnItem { productId: string; name: string; color: string; quantity: number }

export interface ReturnRequest {
  _id: string;
  orderId: { _id: string; randomId: string; totalPrice: number; status?: OrderStatus } | string | null;
  items: ReturnItem[];
  reason: ReturnReason;
  notes?: string;
  lockerUserId: string;
  unlockCode?: string | number; // only present while pending and not expired
  status: ReturnStatus;
  expiresAt: string;
  completedAt?: string | null;
  processedByBox?: string | null;
  imageUploadedAt?: string | null;
  verification?: ReturnVerification | null;
  createdAt: string;
}

// SmartBox drop-off check computed by the backend (weight + image)
export interface ReturnVerification {
  verdict: 'processing' | 'match' | 'review' | 'error';
  reasons: string[];
  visual?: { score: number | null; passed: boolean | null; topLabel: string | null };
  weight?: { measured: number | null; expected: number | null; passed: boolean | null };
  checkedAt?: string | null;
}

export interface CreateReturnInput {
  orderId: string;
  reason: ReturnReason;
  notes?: string;
  items: ReturnItem[];
}

export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  phone: string;
  avatar?: string;
  address: string;
  city: string;
  governorate: string;
  role: 'user' | 'admin';
  isVerified: boolean;
  membershipTier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  totalSpent: number;
  orders: { orderId: unknown }[];
  createdAt: string;
}

export type UpdateProfileInput = Partial<Pick<User, 'firstName' | 'lastName' | 'phone' | 'address' | 'city' | 'governorate'>>;

export interface Locker {
  _id: string;
  boxId: string;
  name: string;
  address: string;
  city?: string;
  location: { lat: number; lng: number };
  status: 'available' | 'busy' | 'maintenance';
  hours: string;
  freeSlots: number;
}
