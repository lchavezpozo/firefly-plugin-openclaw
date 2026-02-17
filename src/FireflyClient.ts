/**
 * Firefly III API Client
 * 
 * A typed client for interacting with the Firefly III REST API.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { homedir } from 'os';
import type {
  FireflyConfig,
  FireflyCredentials,
  FireflyAccount,
  FireflyTransaction,
  FireflyCategory,
  FireflyApiResponse,
  FireflySummary,
  AccountBalance,
  AccountsResult,
  TransactionRecord,
  TransactionInput,
  TransactionResult,
  CategoryInfo,
} from './types.js';

export class FireflyClient {
  private readonly url: string;
  private readonly token: string;

  constructor(config: FireflyConfig) {
    const credentials = this.resolveCredentials(config);
    this.url = credentials.url.replace(/\/$/, ''); // Remove trailing slash
    this.token = credentials.token;
  }

  // ============================================
  // Credential Resolution
  // ============================================

  private resolveCredentials(config: FireflyConfig): FireflyCredentials {
    if (config.url && config.token) {
      return { url: config.url, token: config.token };
    }

    if (config.credentialsPath) {
      return this.loadCredentialsFromFile(config.credentialsPath);
    }

    throw new Error(
      'Firefly III not configured. Provide url+token or credentialsPath.'
    );
  }

  private loadCredentialsFromFile(path: string): FireflyCredentials {
    const expandedPath = this.expandPath(path);
    const content = readFileSync(expandedPath, 'utf-8');
    const creds = JSON.parse(content);

    if (!creds.url || !creds.token) {
      throw new Error(`Invalid credentials file: missing url or token`);
    }

    return { url: creds.url, token: creds.token };
  }

  private expandPath(path: string): string {
    if (path.startsWith('~/')) {
      return resolve(homedir(), path.slice(2));
    }
    return resolve(path);
  }

  // ============================================
  // HTTP Client
  // ============================================

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.url}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new FireflyApiError(response.status, response.statusText, text);
    }

    if (response.status === 204) {
      return null as T;
    }

    return response.json();
  }

  // ============================================
  // Account Operations
  // ============================================

  async getAccounts(): Promise<AccountsResult> {
    const response = await this.request<FireflyApiResponse<FireflyAccount>>(
      '/api/v1/accounts?type=asset'
    );

    const accounts: AccountBalance[] = response.data.map((acc) => ({
      name: acc.attributes.name,
      balance: parseFloat(acc.attributes.current_balance),
      currency: acc.attributes.currency_symbol,
    }));

    const total = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const currency = accounts[0]?.currency || '$';

    return { accounts, total, currency };
  }

  async findAccountByName(name: string): Promise<FireflyAccount | undefined> {
    const response = await this.request<FireflyApiResponse<FireflyAccount>>(
      '/api/v1/accounts?type=asset'
    );

    return response.data.find(
      (acc) => acc.attributes.name.toLowerCase() === name.toLowerCase()
    );
  }

  // ============================================
  // Transaction Operations
  // ============================================

  async createTransaction(input: TransactionInput): Promise<TransactionResult> {
    // Find source account
    const sourceAccount = await this.findAccountByName(input.account);
    if (!sourceAccount) {
      const accounts = await this.getAccounts();
      const available = accounts.accounts.map((a) => a.name).join(', ');
      throw new Error(`Account '${input.account}' not found. Available: ${available}`);
    }

    const transaction: Record<string, unknown> = {
      type: input.type,
      date: new Date().toISOString().split('T')[0],
      amount: input.amount.toString(),
      description: input.description,
      source_id: sourceAccount.id,
    };

    if (input.category) {
      transaction.category_name = input.category;
    }

    // Handle transfers
    if (input.type === 'transfer' && input.destination_account) {
      const destAccount = await this.findAccountByName(input.destination_account);
      if (!destAccount) {
        throw new Error(`Destination account '${input.destination_account}' not found.`);
      }
      transaction.destination_id = destAccount.id;
    }

    const response = await this.request<{ data: FireflyTransaction }>(
      '/api/v1/transactions',
      {
        method: 'POST',
        body: JSON.stringify({ transactions: [transaction] }),
      }
    );

    const tx = response.data.attributes.transactions[0];
    return {
      success: true,
      id: response.data.id,
      type: tx.type,
      amount: tx.amount,
      currency: tx.currency_symbol,
      description: tx.description,
      date: tx.date,
      category: tx.category_name || null,
    };
  }

  async getRecentTransactions(limit: number = 10): Promise<TransactionRecord[]> {
    const response = await this.request<FireflyApiResponse<FireflyTransaction>>(
      `/api/v1/transactions?limit=${limit}`
    );

    return response.data.map((tx) => {
      const t = tx.attributes.transactions[0];
      return {
        id: tx.id,
        date: t.date?.split('T')[0] || '',
        type: t.type,
        amount: `${t.currency_symbol}${t.amount}`,
        description: t.description,
        category: t.category_name || null,
        source: t.source_name,
        destination: t.destination_name,
      };
    });
  }

  async deleteTransaction(transactionId: string): Promise<void> {
    await this.request(`/api/v1/transactions/${transactionId}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // Summary & Categories
  // ============================================

  async getMonthlySummary(): Promise<FireflySummary> {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split('T')[0];
    const end = now.toISOString().split('T')[0];

    return this.request<FireflySummary>(
      `/api/v1/summary/basic?start=${start}&end=${end}`
    );
  }

  async getCategories(): Promise<CategoryInfo[]> {
    const response = await this.request<FireflyApiResponse<FireflyCategory>>(
      '/api/v1/categories'
    );

    return response.data.map((cat) => ({
      id: cat.id,
      name: cat.attributes.name,
      spent: cat.attributes.spent?.[0]?.sum || null,
      earned: cat.attributes.earned?.[0]?.sum || null,
    }));
  }
}

// ============================================
// Custom Error
// ============================================

export class FireflyApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly body: string
  ) {
    super(`Firefly API error: ${status} ${statusText} - ${body}`);
    this.name = 'FireflyApiError';
  }
}
