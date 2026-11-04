import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ApiError, cartApi, categoriesApi, lockersApi, ordersApi, productsApi, returnsApi, wishlistApi,
  type CartResponse, type CreateOrderInput, type CreateReturnInput, type ProductQuery,
} from '@/api';

export const keys = {
  products: (q: ProductQuery) => ['products', q] as const,
  featured: ['products', 'featured'] as const,
  product: (id: string) => ['product', id] as const,
  reviews: (id: string) => ['reviews', id] as const,
  categories: ['categories'] as const,
  cart: ['cart'] as const,
  wishlist: ['wishlist'] as const,
  orders: ['orders'] as const,
  order: (id: string) => ['order', id] as const,
  shippingRates: ['shippingRates'] as const,
  returns: ['returns'] as const,
  return: (id: string) => ['return', id] as const,
  lockers: ['lockers'] as const,
};

// ── Catalog ───────────────────────────────────────────────────────────────────
export const useProducts = (query: ProductQuery) =>
  useInfiniteQuery({
    queryKey: keys.products(query),
    queryFn: ({ pageParam }) => productsApi.list({ limit: 12, ...query, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
  });

export const useFeaturedProducts = () =>
  useQuery({ queryKey: keys.featured, queryFn: () => productsApi.featured(8).then((r) => r.products) });

export const useProduct = (id: string) =>
  useQuery({ queryKey: keys.product(id), queryFn: () => productsApi.get(id).then((r) => r.product), enabled: !!id });

export const useReviews = (id: string) =>
  useQuery({ queryKey: keys.reviews(id), queryFn: () => productsApi.reviews(id), enabled: !!id });

export const useCategories = () =>
  useQuery({ queryKey: keys.categories, queryFn: () => categoriesApi.list().then((r) => r.categories), staleTime: 10 * 60_000 });

// ── Cart ──────────────────────────────────────────────────────────────────────
export const useCart = () => useQuery({ queryKey: keys.cart, queryFn: cartApi.get });

export class StockLimitError extends Error {
  constructor(public available: number) {
    super(available > 0 ? `Only ${available} left in stock` : 'No more stock available');
  }
}

// All cart mutations return the full cart, so we write it straight into the cache.
function useCartMutation<V>(fn: (v: V) => Promise<Partial<CartResponse> & { stockLimitReached?: boolean; available?: number }>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: V) => {
      const res = await fn(v);
      if (res.stockLimitReached) throw new StockLimitError(res.available ?? 0);
      return res as CartResponse;
    },
    onSuccess: (data) => qc.setQueryData(keys.cart, data),
  });
}

type CartLine = { productId: string; color: string };
export const useAddToCart = () =>
  useCartMutation((v: CartLine & { quantity?: number }) => cartApi.add(v.productId, v.color, v.quantity ?? 1));
export const useIncrementCart = () => useCartMutation((v: CartLine) => cartApi.increment(v.productId, v.color));
export const useDecrementCart = () => useCartMutation((v: CartLine) => cartApi.decrement(v.productId, v.color));
export const useRemoveFromCart = () => useCartMutation((v: CartLine) => cartApi.remove(v.productId, v.color));

export const useCartCount = () => {
  const { data } = useCart();
  return data?.totalQuantity ?? 0;
};

// ── Wishlist ──────────────────────────────────────────────────────────────────
export const useWishlist = () =>
  useQuery({ queryKey: keys.wishlist, queryFn: () => wishlistApi.get().then((r) => r.wishList.items.filter((i) => i.productId)) });

export const useIsWishlisted = (productId: string) => {
  const { data } = useWishlist();
  return !!data?.some((i) => i.productId?._id === productId);
};

export const useToggleWishlist = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => wishlistApi.toggle(productId),
    onSuccess: (res) => qc.setQueryData(keys.wishlist, res.wishList.items.filter((i) => i.productId)),
  });
};

// ── Orders ────────────────────────────────────────────────────────────────────
export const useOrders = () => useQuery({ queryKey: keys.orders, queryFn: () => ordersApi.mine(1, 50).then((r) => r.orders) });

export const useOrder = (id: string) =>
  useQuery({ queryKey: keys.order(id), queryFn: () => ordersApi.get(id).then((r) => r.order), enabled: !!id });

export const useShippingRates = () =>
  useQuery({ queryKey: keys.shippingRates, queryFn: () => ordersApi.shippingRates().then((r) => r.shippingRates), staleTime: 60 * 60_000 });

export const useCreateOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateOrderInput) => ordersApi.create(data).then((r) => r.order),
    onSuccess: (order) => {
      qc.setQueryData(keys.order(order._id), order);
      qc.invalidateQueries({ queryKey: keys.cart });
      qc.invalidateQueries({ queryKey: keys.orders });
    },
  });
};

// ── Returns & lockers ─────────────────────────────────────────────────────────
export const useReturns = () => useQuery({ queryKey: keys.returns, queryFn: () => returnsApi.mine(1, 50).then((r) => r.returns) });

export const useReturn = (id: string) =>
  useQuery({ queryKey: keys.return(id), queryFn: () => returnsApi.get(id).then((r) => r.returnRequest), enabled: !!id });

export const useCreateReturn = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateReturnInput) => returnsApi.create(data).then((r) => r.returnRequest),
    onSuccess: (rr) => {
      qc.setQueryData(keys.return(rr._id), rr);
      qc.invalidateQueries({ queryKey: keys.returns });
      qc.invalidateQueries({ queryKey: keys.orders });
    },
  });
};

export const useLockers = () =>
  useQuery({ queryKey: keys.lockers, queryFn: () => lockersApi.list().then((r) => r.lockers), staleTime: 5 * 60_000 });

export const isNotFound = (err: unknown) => err instanceof ApiError && (err.status === 404 || err.status === 403);
