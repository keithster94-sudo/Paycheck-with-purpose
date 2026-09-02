import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/paychecks', label: 'Paychecks' },
  { to: '/purposes', label: 'Purposes' },
  { to: '/transactions', label: 'Transactions' },
];

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-lg font-semibold text-purpose-900">
              Paycheck with Purpose
            </h1>
            <p className="text-xs text-slate-500">
              Give every dollar a job before it lands.
            </p>
          </div>
        </div>
        <nav className="mx-auto flex max-w-5xl gap-1 px-4 pb-2 sm:px-6">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-purpose-100 text-purpose-800'
                    : 'text-slate-600 hover:bg-slate-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
