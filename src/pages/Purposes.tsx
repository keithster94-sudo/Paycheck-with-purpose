import { useMemo, useState } from 'react';
import type { Category } from '../types';
import { Button, Card, EmptyState, IconButton, Input } from '../components/ui';
import { formatCurrency } from '../lib/format';
import {
  computeSpentByCategory,
  selectTotalAllocated,
  selectTotalIncome,
  useBudgetStore,
} from '../store';

export default function Purposes() {
  const categories = useBudgetStore((s) => s.categories);
  const transactions = useBudgetStore((s) => s.transactions);
  const addCategory = useBudgetStore((s) => s.addCategory);
  const removeCategory = useBudgetStore((s) => s.removeCategory);
  const spentByCategory = useMemo(() => computeSpentByCategory(transactions), [transactions]);
  const totalIncome = useBudgetStore(selectTotalIncome);
  const totalAllocated = useBudgetStore(selectTotalAllocated);

  const [name, setName] = useState('');
  const [allocated, setAllocated] = useState('');
  const [goal, setGoal] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = Number(allocated);
    if (!name.trim() || !Number.isFinite(parsedAmount) || parsedAmount < 0) return;
    const parsedGoal = Number(goal);
    addCategory({
      name: name.trim(),
      allocated: parsedAmount,
      goal: goal.trim() && Number.isFinite(parsedGoal) && parsedGoal > 0 ? parsedGoal : undefined,
    });
    setName('');
    setAllocated('');
    setGoal('');
  };

  const unallocated = totalIncome - totalAllocated;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Purposes</h2>
        <p className="text-sm text-slate-500">
          Envelope-budget your income. Unallocated:{' '}
          <span className={unallocated < 0 ? 'font-medium text-rose-600' : 'font-medium text-purpose-700'}>
            {formatCurrency(unallocated)}
          </span>
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-[2fr_1fr_1fr_auto] sm:items-end">
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-slate-600">Purpose name</span>
            <Input
              type="text"
              placeholder="e.g. Rent, Groceries, Emergency fund"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-slate-600">Allocated amount</span>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={allocated}
              onChange={(e) => setAllocated(e.target.value)}
              required
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-slate-600">Goal (optional)</span>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
            />
          </label>
          <Button type="submit">Add purpose</Button>
        </form>
      </Card>

      <Card>
        {categories.length === 0 ? (
          <EmptyState>No purposes yet. Create one above to start allocating your income.</EmptyState>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2">Purpose</th>
                <th className="py-2 text-right">Allocated</th>
                <th className="py-2 text-right">Spent</th>
                <th className="py-2 text-right">Remaining</th>
                <th className="py-2 text-right">Goal</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => {
                const spent = spentByCategory.get(c.id) ?? 0;
                const remaining = c.allocated - spent;
                return (
                  <tr key={c.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 font-medium text-slate-800">{c.name}</td>
                    <td className="py-2 text-right text-slate-800">{formatCurrency(c.allocated)}</td>
                    <td className="py-2 text-right text-slate-600">{formatCurrency(spent)}</td>
                    <td className={`py-2 text-right font-medium ${remaining < 0 ? 'text-rose-600' : 'text-purpose-700'}`}>
                      {formatCurrency(remaining)}
                    </td>
                    <td className="py-2 text-right">
                      <GoalCell category={c} balance={remaining} />
                    </td>
                    <td className="py-2 text-right">
                      <IconButton onClick={() => removeCategory(c.id)}>Remove</IconButton>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

function GoalCell({ category, balance }: { category: Category; balance: number }) {
  const updateCategory = useBudgetStore((s) => s.updateCategory);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(category.goal ? String(category.goal) : '');

  const commit = () => {
    const parsed = Number(value);
    updateCategory(category.id, {
      goal: value.trim() && Number.isFinite(parsed) && parsed > 0 ? parsed : undefined,
    });
    setEditing(false);
  };

  if (editing) {
    return (
      <Input
        type="number"
        min="0"
        step="0.01"
        autoFocus
        placeholder="0.00"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') setEditing(false);
        }}
        className="ml-auto w-24 text-right"
      />
    );
  }

  if (!category.goal) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-xs font-medium text-purpose-600 hover:text-purpose-800"
      >
        Set goal
      </button>
    );
  }

  const pct = Math.max(0, Math.min(100, (balance / category.goal) * 100));
  const reached = balance >= category.goal;

  return (
    <button type="button" onClick={() => setEditing(true)} className="ml-auto block w-32 text-right">
      <span className={`text-xs ${reached ? 'font-medium text-emerald-600' : 'text-slate-500'}`}>
        {reached
          ? 'Goal reached'
          : `${formatCurrency(Math.max(0, balance))} / ${formatCurrency(category.goal)}`}
      </span>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${reached ? 'bg-emerald-500' : 'bg-purpose-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </button>
  );
}
