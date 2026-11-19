import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { realEstateApi, type EstateQuery, type EstimateInput } from '@/api';
import { useAuth } from '@/providers/AuthProvider';

const root = ['real-estate'] as const;

export function useEstateLocations() {
  return useQuery({
    queryKey: [...root, 'locations'],
    queryFn: realEstateApi.locations,
    staleTime: 24 * 60 * 60_000,
  });
}

export function useProperties(query: EstateQuery, enabled = true) {
  return useQuery({
    queryKey: [...root, 'list', query],
    queryFn: () => realEstateApi.list(query),
    enabled,
  });
}

export function useProperty(id?: string) {
  const { user, status } = useAuth();
  return useQuery({
    queryKey: [...root, 'detail', id, status, user?._id],
    queryFn: () => realEstateApi.get(id!),
    enabled: !!id && status !== 'loading',
  });
}

export function useMyProperties() {
  const { user, status } = useAuth();
  return useQuery({
    queryKey: [...root, 'mine', user?._id],
    queryFn: realEstateApi.mine,
    enabled: status === 'authenticated',
  });
}

export function useEstimate() {
  return useMutation({
    mutationFn: (input: EstimateInput) => realEstateApi.estimate(input),
    retry: false,
  });
}

export function useEstateMutations() {
  const client = useQueryClient();
  const onSuccess = () => client.invalidateQueries({ queryKey: root });
  const save = useMutation({
    mutationFn: ({ id, body }: { id?: string; body: FormData }) =>
      id ? realEstateApi.update(id, body) : realEstateApi.create(body),
    onSuccess,
  });
  const status = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'sold' | 'rented' | 'archived' }) =>
      realEstateApi.status(id, status),
    onSuccess,
  });
  const remove = useMutation({
    mutationFn: realEstateApi.delete,
    onSuccess: async (_, id) => {
      client.removeQueries({ queryKey: [...root, 'detail', id] });
      await onSuccess();
    },
  });
  return { save, status, remove };
}
