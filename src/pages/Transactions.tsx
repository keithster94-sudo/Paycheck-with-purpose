import { useState } from 'react';
import { Button, Card, EmptyState, IconButton, Input } from '../components/ui';
import { formatCurrency, formatDate, todayIso } from '../lib/format';
import { selectTotalSpent, useBudgetStore } from '../store';

export default function Transactions() {
  const categories = useBudgetStore((s) => s.categories);
  const transactions = useBudgetStore((s) => s.transactions);
  const addTransaction = useBudgetStore((s) => s.addTransaction);
  const removeTransaction = useBudgetStore((s) => s.removeTransaction);
  const totalSpent = useBudgetStore(selectTotalSpent);

  const [date, setDate] = useState(todayIso());
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = Number(amount);
    if (!categoryId || !description.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) return;
    addTransaction({ date, categoryId, description: description.trim(), amount: parsedAmount });
    setDescription('');
    setAmount('');
  };

  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? 'Unknown purpose';
  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Transactions</h2>
        <p className="text-sm text-slate-500">Total spent: {formatCurrency(totalSpent)}</p>
      </div>

      <Card>
        {categories.length === 0 ? (
          <EmptyState>Create a purpose first, then you can log transactions against it.</EmptyState>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_2fr_1fr_auto] sm:items-end"
          >
            <label className="text-sm">
              <span className="mb-1 block text-xs font-medium text-slate-600">Date</span>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs font-medium text-slate-600">Purpose</span>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-purpose-500 focus:outline-none focus:ring-1 focus:ring-purpose-500"
              >
                <option value="" disabled>
                  Select…
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs font-medium text-slate-600">Description</span>
              <Input
                type="text"
                placeholder="e.g. Trader Joe's"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs font-medium text-slate-600">Amount</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </label>
            <Button type="submit">Add transaction</Button>
          </form>
        )}
      </Card>

      <Card>
        {sorted.length === 0 ? (
          <EmptyState>No transactions logged yet.</EmptyState>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2">Date</th>
                <th className="py-2">Purpose</th>
                <th className="py-2">Description</th>
                <th className="py-2 text-right">Amount</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((t) => (
                <tr key={t.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-2 text-slate-600">{formatDate(t.date)}</td>
                  <td className="py-2 text-slate-600">{categoryName(t.categoryId)}</td>
                  <td className="py-2 font-medium text-slate-800">{t.description}</td>
                  <td className="py-2 text-right text-slate-800">{formatCurrency(t.amount)}</td>
                  <td className="py-2 text-right">
                    <IconButton onClick={() => removeTransaction(t.id)}>Remove</IconButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
