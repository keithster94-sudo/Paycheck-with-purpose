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
}

export interface Transaction {
  id: string;
  date: string;
  categoryId: string;
  description: string;
  amount: number;
}
