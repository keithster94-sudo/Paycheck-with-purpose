import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function Stat({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'good' | 'bad' }) {
  const toneClass =
    tone === 'good' ? 'text-purpose-700' : tone === 'bad' ? 'text-rose-600' : 'text-slate-900';
  return (
    <Card>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${toneClass}`}>{value}</p>
    </Card>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-purpose-500 focus:outline-none focus:ring-1 focus:ring-purpose-500 ${props.className ?? ''}`}
    />
  );
}

export function Button({ children, className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={`rounded-md bg-purpose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purpose-700 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

export function IconButton({ children, className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={`rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-600 ${className}`}
    >
      {children}
    </button>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-md border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
      {children}
    </p>
  );
}
