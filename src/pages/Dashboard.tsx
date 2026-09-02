import { useMemo } from 'react';
import { formatCurrency } from '../lib/format';
import {
  computeSpentByCategory,
  selectTotalAllocated,
  selectTotalIncome,
  selectTotalSpent,
  useBudgetStore,
} from '../store';
import { Card, EmptyState, Stat } from '../components/ui';

export default function Dashboard() {
  const categories = useBudgetStore((s) => s.categories);
  const transactions = useBudgetStore((s) => s.transactions);
  const totalIncome = useBudgetStore(selectTotalIncome);
  const totalAllocated = useBudgetStore(selectTotalAllocated);
  const totalSpent = useBudgetStore(selectTotalSpent);
  const spentByCategory = useMemo(
    () => computeSpentByCategory(transactions, categories),
    [transactions, categories],
  );

  const unallocated = totalIncome - totalAllocated;
  const remaining = totalAllocated - totalSpent;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Dashboard</h2>
        <p className="text-sm text-slate-500">
          Zero-based budgeting: give every paycheck dollar a purpose.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Total income" value={formatCurrency(totalIncome)} />
        <Stat label="Allocated" value={formatCurrency(totalAllocated)} />
        <Stat
          label="Unallocated"
          value={formatCurrency(unallocated)}
          tone={unallocated === 0 ? 'good' : unallocated < 0 ? 'bad' : 'default'}
        />
        <Stat
          label="Remaining to spend"
          value={formatCurrency(remaining)}
          tone={remaining < 0 ? 'bad' : 'good'}
        />
      </div>

      <Card>
        <h3 className="mb-3 text-sm font-semibold text-slate-700">Purposes overview</h3>
        {categories.length === 0 ? (
          <EmptyState>
            No purposes yet. Head to the Purposes tab to create your first budget envelope.
          </EmptyState>
        ) : (
          <div className="space-y-3">
            {categories.map((category) => {
              const spent = spentByCategory.get(category.id) ?? 0;
              const remainingInCategory = category.allocated - spent;
              const pct = category.allocated > 0 ? Math.min(100, (spent / category.allocated) * 100) : 0;
              const over = remainingInCategory < 0;
              return (
                <div key={category.id}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 font-medium text-slate-800">
                      {category.name}
                      {category.resetsMonthly && (
                        <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                          Monthly
                        </span>
                      )}
                    </span>
                    <span className={over ? 'text-rose-600' : 'text-slate-500'}>
                      {formatCurrency(spent)} / {formatCurrency(category.allocated)}
                    </span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${over ? 'bg-rose-500' : 'bg-purpose-500'}`}
                      style={{ width: `${over ? 100 : pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
