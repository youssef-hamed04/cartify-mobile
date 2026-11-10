import { api } from './client';
import type {
  AddToCartResponse, AssistantChatResponse, AssistantPendingAction, AssistantTranscriptEntry, CartResponse, Category,
  CreateOrderInput, CreateReturnInput, Locker, Order, Paginated, Product, ReturnRequest, Review, UpdateProfileInput, User,
  WishlistItem,
} from './types';

export * from './types';
export { API_URL, ApiError, errorMessage } from './client';

export type ProductSort = 'newest' | 'price_asc' | 'price_desc' | 'rating';
export interface ProductQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  brand?: string;
  sort?: ProductSort;
  featured?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

export const authApi = {
  requestCode: (email: string) =>
    api<{ message: string; expiresInSeconds: number }>('/users/otp/request', { method: 'POST', body: { email } }),
  verifyCode: (email: string, code: string) =>
    api<{ token: string; isNew: boolean; user: User }>('/users/otp/verify', { method: 'POST', body: { email, code } }),
  logout: () => api('/users/logout', { method: 'POST' }),
  me: () => api<{ user: User }>('/users/me'),
  updateMe: (data: UpdateProfileInput) => api<{ user: User }>('/users/me', { method: 'PATCH', body: data }),
};

export const productsApi = {
  list: (query: ProductQuery = {}) => api<Paginated & { products: Product[] }>('/products', { query: { ...query } }),
  featured: (limit = 8) => api<{ products: Product[] }>('/products/featured', { query: { limit } }),
  get: (id: string) => api<{ product: Product }>(`/products/${id}`),
  reviews: (id: string, page = 1) => api<Paginated & { reviews: Review[] }>(`/products/${id}/reviews`, { query: { page, limit: 10 } }),
};

export const categoriesApi = {
  list: () => api<{ categories: Category[] }>('/categories'),
};

export const reviewsApi = {
  create: (data: { productId: string; rating: number; title?: string; body?: string; orderId?: string }) =>
    api<{ review: Review }>('/reviews', { method: 'POST', body: data }),
};

export const cartApi = {
  get: () => api<CartResponse>('/cart'),
  add: (productId: string, color: string, quantity = 1) =>
    api<AddToCartResponse>('/cart', { method: 'POST', body: { productId, color, quantity } }),
  increment: (productId: string, color: string) =>
    api<AddToCartResponse>('/cart/add-quantity', { method: 'PATCH', body: { productId, color } }),
  decrement: (productId: string, color: string) =>
    api<CartResponse>('/cart/reduce-quantity', { method: 'PATCH', body: { productId, color } }),
  remove: (productId: string, color: string) =>
    api<CartResponse>('/cart/remove-item', { method: 'PATCH', body: { productId, color } }),
  empty: () => api<CartResponse>('/cart/empty', { method: 'PATCH' }),
};

export const wishlistApi = {
  get: () => api<{ wishList: { items: WishlistItem[] } }>('/wishlist'),
  toggle: (productId: string) =>
    api<{ added: boolean; wishList: { items: WishlistItem[] } }>('/wishlist/toggle', { method: 'POST', body: { productId } }),
};

export const ordersApi = {
  mine: (page = 1, limit = 20) => api<Paginated & { orders: Order[] }>('/orders/my', { query: { page, limit } }),
  get: (id: string) => api<{ order: Order }>(`/orders/${id}`),
  create: (data: CreateOrderInput) => api<{ order: Order }>('/orders', { method: 'POST', body: data }),
  shippingRates: () => api<{ shippingRates: Record<string, number> }>('/orders/shipping-rates'),
};

export const returnsApi = {
  mine: (page = 1, limit = 20) => api<Paginated & { returns: ReturnRequest[] }>('/returns/my', { query: { page, limit } }),
  get: (id: string) => api<{ returnRequest: ReturnRequest }>(`/returns/${id}`),
  create: (data: CreateReturnInput) => api<{ returnRequest: ReturnRequest }>('/returns', { method: 'POST', body: data }),
};

export const lockersApi = {
  list: () => api<{ lockers: Locker[] }>('/lockers'),
};

// AI shopping assistant. The AI provider key stays on the backend; the app only sends messages.
export const assistantApi = {
  status: () => api<{ enabled: boolean }>('/assistant/status'),
  chat: (message: string, conversationId?: string | null) =>
    api<AssistantChatResponse>('/assistant/chat', { method: 'POST', body: { message, ...(conversationId ? { conversationId } : {}) } }),
  conversation: (id: string) =>
    api<{ conversationId: string; transcript: AssistantTranscriptEntry[]; pendingActions: AssistantPendingAction[] }>(`/assistant/conversations/${id}`),
  confirm: (actionId: string, conversationId: string) =>
    api<{ status: string; result: { message: string } }>(`/assistant/actions/${actionId}/confirm`, { method: 'POST', body: { conversationId } }),
  cancel: (actionId: string, conversationId: string) =>
    api<{ status: string; result: { message: string } }>(`/assistant/actions/${actionId}/cancel`, { method: 'POST', body: { conversationId } }),
};
