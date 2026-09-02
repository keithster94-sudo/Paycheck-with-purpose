import { useState } from 'react';
import { Button, Card, EmptyState, IconButton, Input } from '../components/ui';
import { formatCurrency, formatDate, todayIso } from '../lib/format';
import { selectTotalIncome, useBudgetStore } from '../store';

export default function Paychecks() {
  const paychecks = useBudgetStore((s) => s.paychecks);
  const addPaycheck = useBudgetStore((s) => s.addPaycheck);
  const removePaycheck = useBudgetStore((s) => s.removePaycheck);
  const totalIncome = useBudgetStore(selectTotalIncome);

  const [date, setDate] = useState(todayIso());
  const [source, setSource] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = Number(amount);
    if (!source.trim() || !Number.isFinite(parsedAmount) || parsedAmount <= 0) return;
    addPaycheck({ date, source: source.trim(), amount: parsedAmount });
    setSource('');
    setAmount('');
  };

  const sorted = [...paychecks].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Paychecks</h2>
        <p className="text-sm text-slate-500">
          Log income as it arrives. Total logged: {formatCurrency(totalIncome)}
        </p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_2fr_1fr_auto] sm:items-end">
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-slate-600">Date</span>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-slate-600">Source</span>
            <Input
              type="text"
              placeholder="e.g. Employer, Freelance client"
              value={source}
              onChange={(e) => setSource(e.target.value)}
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
          <Button type="submit">Add paycheck</Button>
        </form>
      </Card>

      <Card>
        {sorted.length === 0 ? (
          <EmptyState>No paychecks logged yet.</EmptyState>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2">Date</th>
                <th className="py-2">Source</th>
                <th className="py-2 text-right">Amount</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((p) => (
                <tr key={p.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-2 text-slate-600">{formatDate(p.date)}</td>
                  <td className="py-2 font-medium text-slate-800">{p.source}</td>
                  <td className="py-2 text-right text-slate-800">{formatCurrency(p.amount)}</td>
                  <td className="py-2 text-right">
                    <IconButton onClick={() => removePaycheck(p.id)}>Remove</IconButton>
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
