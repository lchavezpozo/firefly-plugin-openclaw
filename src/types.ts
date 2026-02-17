/**
 * Firefly III Plugin Types
 */

// ============================================
// Configuration
// ============================================

export interface FireflyConfig {
  url?: string;
  token?: string;
  credentialsPath?: string;
}

export interface FireflyCredentials {
  url: string;
  token: string;
}

// ============================================
// API Responses
// ============================================

export interface FireflyAccount {
  id: string;
  attributes: {
    name: string;
    current_balance: string;
    currency_symbol: string;
    currency_code: string;
    type: string;
    active: boolean;
  };
}

export interface FireflyTransaction {
  id: string;
  attributes: {
    transactions: FireflyTransactionDetail[];
  };
}

export interface FireflyTransactionDetail {
  type: 'withdrawal' | 'deposit' | 'transfer';
  date: string;
  amount: string;
  currency_symbol: string;
  currency_code: string;
  description: string;
  source_id: string;
  source_name: string;
  destination_id: string;
  destination_name: string;
  category_id?: string;
  category_name?: string;
}

export interface FireflyCategory {
  id: string;
  attributes: {
    name: string;
    spent?: Array<{ sum: string; currency_symbol: string }>;
    earned?: Array<{ sum: string; currency_symbol: string }>;
  };
}

export interface FireflyApiResponse<T> {
  data: T[];
}

export interface FireflySummary {
  [key: string]: {
    value: string;
    currency_code: string;
    currency_symbol: string;
  };
}

// ============================================
// Plugin Output Types
// ============================================

export interface AccountBalance {
  name: string;
  balance: number;
  currency: string;
}

export interface AccountsResult {
  accounts: AccountBalance[];
  total: number;
  currency: string;
}

export interface TransactionRecord {
  id: string;
  date: string;
  type: string;
  amount: string;
  description: string;
  category: string | null;
  source?: string;
  destination?: string;
}

export interface TransactionInput {
  type: 'withdrawal' | 'deposit' | 'transfer';
  amount: number;
  description: string;
  account: string;
  category?: string;
  destination_account?: string;
}

export interface TransactionResult {
  success: boolean;
  id: string;
  type: string;
  amount: string;
  currency: string;
  description: string;
  date: string;
  category: string | null;
}

export interface CategoryInfo {
  id: string;
  name: string;
  spent: string | null;
  earned: string | null;
}
