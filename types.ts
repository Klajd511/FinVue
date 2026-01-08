
export type TransactionType = 'income' | 'expense';
export type PulseFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Currency {
  code: string;
  symbol: string;
  name: string;
}

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'ALL', symbol: 'Lek', name: 'Albanian Lek' },
];

export const EXCHANGE_RATES: Record<string, number> = {
  'USD': 1,
  'EUR': 0.92,
  'ALL': 94.5,
};

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  type: TransactionType;
  currencyCode: string;
}

export interface Budget {
  category: string;
  limit: number;
}

export interface RecurringPulse {
  id: string;
  description: string;
  amount: number;
  category: string;
  type: TransactionType;
  currencyCode: string;
  frequency: PulseFrequency;
  nextPulseDate: string; // YYYY-MM-DD
}

export interface UserCategories {
  expense: string[];
  income: string[];
}

export interface UserConfig {
  currency: Currency;
  categories: UserCategories;
  budgets: Budget[];
  recurringPulses: RecurringPulse[];
}

export const INITIAL_CATEGORIES: UserCategories = {
  expense: [
    'Housing', 'Food', 'Transport', 'Utilities', 'Entertainment', 'Healthcare', 'Shopping', 'Education', 'Other'
  ],
  income: [
    'Salary', 'Freelance', 'Investments', 'Gift', 'Other'
  ]
};
