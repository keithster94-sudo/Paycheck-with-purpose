export interface Paycheck {
  id: string;
  date: string;
  source: string;
  amount: number;
}

export interface Category {
  id: string;
  name: string;
  allocated: number;
  /** Optional savings target for this purpose, e.g. "save up to $2,000". */
  goal?: number;
  /**
   * When true, spending against this purpose is scoped to the current
   * calendar month: `allocated` dollars become available again each month
   * with no manual reset. When false/unset, spending accumulates all-time
   * (the classic envelope-carryover model).
   */
  resetsMonthly?: boolean;
}

export interface Transaction {
  id: string;
  date: string;
  categoryId: string;
  description: string;
  amount: number;
}

/** A locked-in copy of one transaction as it looked at archive time. */
export interface ArchivedTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
}

/** A locked-in snapshot of one purpose's activity for an archived month. */
export interface ArchivedCategoryReport {
  categoryId: string;
  /** Snapshot of the purpose's name, in case it's later renamed or removed. */
  categoryName: string;
  /** Snapshot of the purpose's allocated amount at archive time. */
  allocated: number;
  spent: number;
  transactions: ArchivedTransaction[];
}

/**
 * A generated expense report for one calendar month, covering every purpose
 * that was set to reset monthly at archive time. Created via
 * `useBudgetStore().archiveMonth(period)` and meant to be reviewed with a
 * client — see Reports.tsx.
 */
export interface ArchivedReport {
  id: string;
  /** "YYYY-MM" */
  period: string;
  /** ISO date the report was generated. */
  createdAt: string;
  categories: ArchivedCategoryReport[];
}
