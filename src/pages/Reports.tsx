import { useMemo, useState } from 'react';
import type { ArchivedReport } from '../types';
import { Button, Card, EmptyState, IconButton } from '../components/ui';
import { formatCurrency, formatDate } from '../lib/format';
import { useBudgetStore } from '../store';

const previousMonthPeriod = () => {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const formatPeriodLabel = (period: string) => {
  const [year, month] = period.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
};

export default function Reports() {
  const categories = useBudgetStore((s) => s.categories);
  const archivedReports = useBudgetStore((s) => s.archivedReports);
  const archiveMonth = useBudgetStore((s) => s.archiveMonth);
  const removeArchivedReport = useBudgetStore((s) => s.removeArchivedReport);

  const [period, setPeriod] = useState(previousMonthPeriod());

  const sortedReports = useMemo(
    () => [...archivedReports].sort((a, b) => b.period.localeCompare(a.period)),
    [archivedReports],
  );
  const alreadyArchived = archivedReports.some((r) => r.period === period);

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <h2 className="text-xl font-semibold text-slate-900">Reports</h2>
        <p className="text-sm text-slate-500">
          Archive a month across every purpose — spending for the month, plus each goal's running
          progress as of that month — then review it as a clean report, on screen or printed for a
          client session.
        </p>
      </div>

      <Card className="print:hidden">
        {categories.length === 0 ? (
          <EmptyState>No purposes yet. Create one on the Purposes page to start archiving reports here.</EmptyState>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="text-sm">
              <span className="mb-1 block text-xs font-medium text-slate-600">Month</span>
              <input
                type="month"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-purpose-500 focus:outline-none focus:ring-1 focus:ring-purpose-500"
              />
            </label>
            <Button type="button" onClick={() => archiveMonth(period)}>
              {alreadyArchived ? 'Re-archive' : 'Archive'} {formatPeriodLabel(period)}
            </Button>
            {alreadyArchived && (
              <span className="text-xs text-slate-500">
                Already archived — archiving again overwrites it with the latest data.
              </span>
            )}
          </div>
        )}
      </Card>

      {sortedReports.length === 0 ? (
        <EmptyState>No archived reports yet.</EmptyState>
      ) : (
        <div className="space-y-4">
          {sortedReports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onRemove={() => removeArchivedReport(report.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ReportCard({ report, onRemove }: { report: ArchivedReport; onRemove: () => void }) {
  const totalAllocated = report.categories.reduce((sum, c) => sum + c.allocated, 0);
  const totalSpent = report.categories.reduce((sum, c) => sum + c.spent, 0);

  return (
    <Card className="print:break-inside-avoid">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{formatPeriodLabel(report.period)}</h3>
          <p className="text-xs text-slate-500">Archived {formatDate(report.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <Button type="button" onClick={() => window.print()} className="bg-slate-600 hover:bg-slate-700">
            Print
          </Button>
          <IconButton onClick={onRemove}>Remove</IconButton>
        </div>
      </div>

      {report.categories.length === 0 ? (
        <p className="text-sm text-slate-500">No purposes existed when this report was archived.</p>
      ) : (
        <div className="space-y-4">
          {report.categories.map((c) => {
            const remaining = c.allocated - c.spent;
            const goalReached = c.goal !== undefined && c.balance >= c.goal;
            const goalPct =
              c.goal !== undefined
                ? Math.max(0, Math.min(100, (c.balance / c.goal) * 100))
                : 0;
            return (
              <div key={c.categoryId}>
                <div className="flex items-center justify-between text-sm font-medium text-slate-800">
                  <span className="flex items-center gap-1.5">
                    {c.categoryName}
                    {c.resetsMonthly && (
                      <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                        Monthly
                      </span>
                    )}
                  </span>
                  <span className={remaining < 0 ? 'text-rose-600' : 'text-slate-600'}>
                    {formatCurrency(c.spent)} / {formatCurrency(c.allocated)} spent
                  </span>
                </div>
                {c.goal !== undefined && (
                  <div className="mt-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className={goalReached ? 'font-medium text-emerald-600' : 'text-slate-500'}>
                        {goalReached
                          ? 'Goal reached'
                          : `${formatCurrency(Math.max(0, c.balance))} / ${formatCurrency(c.goal)} saved`}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${goalReached ? 'bg-emerald-500' : 'bg-purpose-500'}`}
                        style={{ width: `${goalPct}%` }}
                      />
                    </div>
                  </div>
                )}
                {c.transactions.length === 0 ? (
                  <p className="mt-1 text-xs text-slate-400">No transactions logged this month.</p>
                ) : (
                  <table className="mt-2 w-full text-xs">
                    <tbody>
                      {[...c.transactions]
                        .sort((a, b) => a.date.localeCompare(b.date))
                        .map((t) => (
                          <tr key={t.id} className="border-b border-slate-100 last:border-0">
                            <td className="py-1 text-slate-500">{formatDate(t.date)}</td>
                            <td className="py-1 text-slate-700">{t.description}</td>
                            <td className="py-1 text-right text-slate-700">{formatCurrency(t.amount)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 text-sm font-semibold text-slate-900">
        <span>Total</span>
        <span>
          {formatCurrency(totalSpent)} / {formatCurrency(totalAllocated)}
        </span>
      </div>
    </Card>
  );
}
