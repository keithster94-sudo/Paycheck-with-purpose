import { useMemo, useState } from 'react';
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = Number(allocated);
    if (!name.trim() || !Number.isFinite(parsedAmount) || parsedAmount < 0) return;
    addCategory({ name: name.trim(), allocated: parsedAmount });
    setName('');
    setAllocated('');
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
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-[2fr_1fr_auto] sm:items-end">
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
