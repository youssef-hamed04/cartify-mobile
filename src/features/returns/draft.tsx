import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { ReturnReason } from '@/api';

export interface DraftItem {
  productId: string;
  name: string;
  color: string;
  quantity: number;
  max: number;
  unitPrice: number;
}

interface ReturnDraft {
  orderId: string | null;
  items: DraftItem[];
  reason: ReturnReason | null;
  notes: string;
}

interface ReturnDraftContextValue extends ReturnDraft {
  setOrderId: (id: string | null) => void;
  setItems: (items: DraftItem[]) => void;
  setReason: (reason: ReturnReason) => void;
  setNotes: (notes: string) => void;
  reset: () => void;
}

const empty: ReturnDraft = { orderId: null, items: [], reason: null, notes: '' };
const ReturnDraftContext = createContext<ReturnDraftContextValue | null>(null);

// Holds the multi-step return request (select → reason → method) until it is submitted
export function ReturnDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<ReturnDraft>(empty);
  const value = useMemo<ReturnDraftContextValue>(() => ({
    ...draft,
    // Switching order clears the picked items
    setOrderId: (orderId) => setDraft((d) => (d.orderId === orderId ? d : { ...d, orderId, items: [] })),
    setItems: (items) => setDraft((d) => ({ ...d, items })),
    setReason: (reason) => setDraft((d) => ({ ...d, reason })),
    setNotes: (notes) => setDraft((d) => ({ ...d, notes })),
    reset: () => setDraft(empty),
  }), [draft]);
  return <ReturnDraftContext.Provider value={value}>{children}</ReturnDraftContext.Provider>;
}

export function useReturnDraft() {
  const ctx = useContext(ReturnDraftContext);
  if (!ctx) throw new Error('useReturnDraft must be used inside the return flow layout');
  return ctx;
}
