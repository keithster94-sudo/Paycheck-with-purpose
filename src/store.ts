import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { todayIso } from './lib/format';
import type { ArchivedReport, Category, Paycheck, Transaction } from './types';

interface BudgetState {
  paychecks: Paycheck[];
  categories: Category[];
  transactions: Transaction[];
  archivedReports: ArchivedReport[];

  addPaycheck: (paycheck: Omit<Paycheck, 'id'>) => void;
  removePaycheck: (id: string) => void;

  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, patch: Partial<Omit<Category, 'id'>>) => void;
  removeCategory: (id: string) => void;

  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  removeTransaction: (id: string) => void;

  /**
   * Generates (or regenerates) an expense report for `period` ("YYYY-MM"),
   * covering every purpose currently set to reset monthly. Locks in each
   * purpose's name, allocated amount, and that month's transactions, so the
   * report stays accurate even if those purposes later change. Archiving
   * the same period again replaces the existing report for it.
   */
  archiveMonth: (period: string) => void;
  removeArchivedReport: (id: string) => void;
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
      archivedReports: [],

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

      archiveMonth: (period) =>
        set((state) => {
          const report: ArchivedReport = {
            id: makeId(),
            period,
            createdAt: todayIso(),
            categories: state.categories
              .filter((c) => c.resetsMonthly)
              .map((c) => {
                const monthTransactions = state.transactions.filter(
                  (t) => t.categoryId === c.id && t.date.slice(0, 7) === period,
                );
                return {
                  categoryId: c.id,
                  categoryName: c.name,
                  allocated: c.allocated,
                  spent: monthTransactions.reduce((sum, t) => sum + t.amount, 0),
                  transactions: monthTransactions.map((t) => ({
                    id: t.id,
                    date: t.date,
                    description: t.description,
                    amount: t.amount,
                  })),
                };
              }),
          };
          return {
            archivedReports: [
              ...state.archivedReports.filter((r) => r.period !== period),
              report,
            ],
          };
        }),
      removeArchivedReport: (id) =>
        set((state) => ({
          archivedReports: state.archivedReports.filter((r) => r.id !== id),
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

const isSameMonth = (isoDate: string, reference: Date) => {
  const [year, month] = isoDate.split('-').map(Number);
  return year === reference.getFullYear() && month === reference.getMonth() + 1;
};

/**
 * Not a zustand selector: building a Map here would return a new reference
 * on every call and break useSyncExternalStore's snapshot caching. Call this
 * from a component with useMemo, keyed on the transactions array instead.
 *
 * Always sums all-time, ignoring `resetsMonthly` — this is the "money ever
 * put toward this purpose" figure a savings goal's progress bar should use,
 * so goal progress never resets even for a purpose whose Spent/Remaining
 * columns do (see computeSpentByCategory below).
 */
export const computeAllTimeSpentByCategory = (transactions: Transaction[]) => {
  const map = new Map<string, number>();
  for (const t of transactions) {
    map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount);
  }
  return map;
};

/**
 * Not a zustand selector: building a Map here would return a new reference
 * on every call and break useSyncExternalStore's snapshot caching. Call this
 * from a component with useMemo, keyed on the transactions and categories
 * arrays instead.
 *
 * Categories with `resetsMonthly` only count transactions dated in the
 * current calendar month (per `referenceDate`, default now) — that's what
 * makes their `allocated` amount "come back" each month with no manual
 * reset. Other categories accumulate spending all-time. This drives the
 * Spent/Remaining columns; goal progress deliberately uses
 * computeAllTimeSpentByCategory instead so it isn't affected by the
 * monthly reset.
 */
export const computeSpentByCategory = (
  transactions: Transaction[],
  categories: Category[],
  referenceDate = new Date(),
) => {
  const resetsMonthly = new Set(
    categories.filter((c) => c.resetsMonthly).map((c) => c.id),
  );
  const map = new Map<string, number>();
  for (const t of transactions) {
    if (resetsMonthly.has(t.categoryId) && !isSameMonth(t.date, referenceDate)) {
      continue;
    }
    map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount);
  }
  return map;
};
