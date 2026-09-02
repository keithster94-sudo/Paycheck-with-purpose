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
