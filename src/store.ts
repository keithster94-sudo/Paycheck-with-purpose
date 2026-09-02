import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Category, Paycheck, Transaction } from './types';

interface BudgetState {
  paychecks: Paycheck[];
  categories: Category[];
  transactions: Transaction[];

  addPaycheck: (paycheck: Omit<Paycheck, 'id'>) => void;
  removePaycheck: (id: string) => void;

  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, patch: Partial<Omit<Category, 'id'>>) => void;
  removeCategory: (id: string) => void;

  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  removeTransaction: (id: string) => void;
}

const makeId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const useBudgetStore = create<BudgetState>()(
  persist(
    (set) => ({
      paychecks: [],
      categories: [],
      transactions: [],

      addPaycheck: (paycheck) =>
        set((state) => ({
          paychecks: [...state.paychecks, { ...paycheck, id: makeId() }],
        })),
      removePaycheck: (id) =>
        set((state) => ({
          paychecks: state.paychecks.filter((p) => p.id !== id),
        })),

      addCategory: (category) =>
        set((state) => ({
          categories: [...state.categories, { ...category, id: makeId() }],
        })),
      updateCategory: (id, patch) =>
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === id ? { ...c, ...patch } : c,
          ),
        })),
      removeCategory: (id) =>
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
          transactions: state.transactions.filter((t) => t.categoryId !== id),
        })),

      addTransaction: (transaction) =>
        set((state) => ({
          transactions: [
            ...state.transactions,
            { ...transaction, id: makeId() },
          ],
        })),
      removeTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        })),
    }),
    { name: 'paycheck-with-purpose' },
  ),
);

export const selectTotalIncome = (state: BudgetState) =>
  state.paychecks.reduce((sum, p) => sum + p.amount, 0);

export const selectTotalAllocated = (state: BudgetState) =>
  state.categories.reduce((sum, c) => sum + c.allocated, 0);

export const selectTotalSpent = (state: BudgetState) =>
  state.transactions.reduce((sum, t) => sum + t.amount, 0);

/**
 * Not a zustand selector: building a Map here would return a new reference
 * on every call and break useSyncExternalStore's snapshot caching. Call this
 * from a component with useMemo, keyed on the transactions array instead.
 */
export const computeSpentByCategory = (transactions: Transaction[]) => {
  const map = new Map<string, number>();
  for (const t of transactions) {
    map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount);
  }
  return map;
};
