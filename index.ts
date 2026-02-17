/**
 * Firefly III Plugin for OpenClaw
 * 
 * Personal finance management - check balances, record transactions, view spending.
 * https://github.com/lchavezpozo/firefly-plugin-openclaw
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { homedir } from "os";

interface FireflyConfig {
  url?: string;
  token?: string;
  credentialsPath?: string;
}

interface Credentials {
  url: string;
  token: string;
}

function expandPath(p: string): string {
  if (p.startsWith("~/")) {
    return resolve(homedir(), p.slice(2));
  }
  return resolve(p);
}

function getCredentials(config: FireflyConfig): Credentials {
  // Direct config takes precedence
  if (config.url && config.token) {
    return { url: config.url, token: config.token };
  }
  
  // Try credentials file
  if (config.credentialsPath) {
    const credPath = expandPath(config.credentialsPath);
    const creds = JSON.parse(readFileSync(credPath, "utf-8"));
    return { url: creds.url, token: creds.token };
  }
  
  throw new Error(
    "Firefly III plugin not configured. Set url+token in config or provide credentialsPath."
  );
}

async function fireflyFetch(creds: Credentials, endpoint: string, options: RequestInit = {}) {
  const url = creds.url.replace(/\/$/, ""); // Remove trailing slash
  const response = await fetch(`${url}${endpoint}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${creds.token}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Firefly API error: ${response.status} ${response.statusText} - ${text}`);
  }
  
  if (response.status === 204) return null;
  return response.json();
}

export default function (api: any) {
  const config: FireflyConfig = api.config?.plugins?.entries?.["firefly-iii"]?.config || {};

  // ============================================
  // Tool: Get account balances
  // ============================================
  api.registerTool({
    name: "firefly_accounts",
    description: "Get all asset account balances from Firefly III. Use when user asks about their money, balances, or 'cuánto tengo'.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
    async execute() {
      const creds = getCredentials(config);
      const data = await fireflyFetch(creds, "/api/v1/accounts?type=asset");
      
      const accounts = data.data.map((acc: any) => ({
        name: acc.attributes.name,
        balance: parseFloat(acc.attributes.current_balance),
        currency: acc.attributes.currency_symbol,
      }));
      
      const total = accounts.reduce((sum: number, acc: any) => sum + acc.balance, 0);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ accounts, total, currency: accounts[0]?.currency || "$" }, null, 2)
        }]
      };
    },
  });

  // ============================================
  // Tool: Record a transaction
  // ============================================
  api.registerTool({
    name: "firefly_transaction",
    description: "Record a new transaction (expense, income, or transfer) in Firefly III. Use for 'gasté', 'pagué', 'compré', 'recibí', 'transferí'.",
    parameters: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["withdrawal", "deposit", "transfer"],
          description: "Transaction type: withdrawal (expense), deposit (income), transfer"
        },
        amount: {
          type: "number",
          description: "Transaction amount (positive number)"
        },
        description: {
          type: "string",
          description: "What was this transaction for"
        },
        account: {
          type: "string",
          description: "Source account name (e.g., 'Checking', 'Savings')"
        },
        category: {
          type: "string",
          description: "Optional category (e.g., 'Food', 'Transport')"
        },
        destination_account: {
          type: "string",
          description: "Destination account (required for transfers)"
        },
      },
      required: ["type", "amount", "description", "account"],
    },
    async execute(_id: string, params: any) {
      const creds = getCredentials(config);
      
      // Get source account ID
      const accountsData = await fireflyFetch(creds, "/api/v1/accounts?type=asset");
      const sourceAccount = accountsData.data.find((acc: any) => 
        acc.attributes.name.toLowerCase() === params.account.toLowerCase()
      );
      
      if (!sourceAccount) {
        const available = accountsData.data.map((a: any) => a.attributes.name).join(", ");
        return {
          content: [{
            type: "text",
            text: `Error: Account '${params.account}' not found. Available accounts: ${available}`
          }]
        };
      }

      const transaction: any = {
        type: params.type,
        date: new Date().toISOString().split("T")[0],
        amount: params.amount.toString(),
        description: params.description,
        source_id: sourceAccount.id,
      };

      if (params.category) {
        transaction.category_name = params.category;
      }

      if (params.type === "transfer" && params.destination_account) {
        const destAccount = accountsData.data.find((acc: any) =>
          acc.attributes.name.toLowerCase() === params.destination_account.toLowerCase()
        );
        if (destAccount) {
          transaction.destination_id = destAccount.id;
        } else {
          return {
            content: [{
              type: "text",
              text: `Error: Destination account '${params.destination_account}' not found.`
            }]
          };
        }
      }

      const result = await fireflyFetch(creds, "/api/v1/transactions", {
        method: "POST",
        body: JSON.stringify({ transactions: [transaction] }),
      });

      const tx = result.data.attributes.transactions[0];
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: true,
            id: result.data.id,
            type: tx.type,
            amount: tx.amount,
            currency: tx.currency_symbol,
            description: tx.description,
            date: tx.date,
            category: tx.category_name || null,
          }, null, 2)
        }]
      };
    },
  });

  // ============================================
  // Tool: Get recent transactions
  // ============================================
  api.registerTool({
    name: "firefly_recent",
    description: "Get recent transactions from Firefly III. Use for 'últimos gastos', 'transacciones recientes', 'en qué gasté'.",
    parameters: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Number of transactions to return (default 10)"
        },
      },
      required: [],
    },
    async execute(_id: string, params: any) {
      const creds = getCredentials(config);
      const limit = params.limit || 10;
      const data = await fireflyFetch(creds, `/api/v1/transactions?limit=${limit}`);
      
      const transactions = data.data.map((tx: any) => {
        const t = tx.attributes.transactions[0];
        return {
          id: tx.id,
          date: t.date?.split("T")[0],
          type: t.type,
          amount: `${t.currency_symbol}${t.amount}`,
          description: t.description,
          category: t.category_name || null,
          source: t.source_name,
          destination: t.destination_name,
        };
      });

      return {
        content: [{
          type: "text",
          text: JSON.stringify(transactions, null, 2)
        }]
      };
    },
  });

  // ============================================
  // Tool: Delete a transaction
  // ============================================
  api.registerTool({
    name: "firefly_delete",
    description: "Delete a transaction from Firefly III by its ID.",
    parameters: {
      type: "object",
      properties: {
        transaction_id: {
          type: "string",
          description: "The transaction ID to delete"
        },
      },
      required: ["transaction_id"],
    },
    async execute(_id: string, params: any) {
      const creds = getCredentials(config);
      
      await fireflyFetch(creds, `/api/v1/transactions/${params.transaction_id}`, {
        method: "DELETE",
      });

      return {
        content: [{
          type: "text",
          text: JSON.stringify({ success: true, deleted: params.transaction_id })
        }]
      };
    },
  });

  // ============================================
  // Tool: Get monthly summary
  // ============================================
  api.registerTool({
    name: "firefly_summary",
    description: "Get a financial summary for the current month from Firefly III. Use for 'resumen del mes', 'cuánto gasté este mes'.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
    async execute() {
      const creds = getCredentials(config);
      
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      const end = now.toISOString().split("T")[0];
      
      const data = await fireflyFetch(creds, `/api/v1/summary/basic?start=${start}&end=${end}`);

      return {
        content: [{
          type: "text",
          text: JSON.stringify(data, null, 2)
        }]
      };
    },
  });

  // ============================================
  // Tool: Get categories
  // ============================================
  api.registerTool({
    name: "firefly_categories",
    description: "List all spending categories from Firefly III.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
    async execute() {
      const creds = getCredentials(config);
      const data = await fireflyFetch(creds, "/api/v1/categories");
      
      const categories = data.data.map((cat: any) => ({
        id: cat.id,
        name: cat.attributes.name,
        spent: cat.attributes.spent || null,
        earned: cat.attributes.earned || null,
      }));

      return {
        content: [{
          type: "text",
          text: JSON.stringify(categories, null, 2)
        }]
      };
    },
  });
}
