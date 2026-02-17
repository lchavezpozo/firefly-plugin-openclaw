/**
 * Tool: firefly_transaction
 * Record a new transaction (expense, income, or transfer)
 */

import type { FireflyClient } from '../FireflyClient.js';
import type { TransactionInput } from '../types.js';

export const transactionTool = {
  name: 'firefly_transaction',
  description:
    "Record a new transaction (expense, income, or transfer) in Firefly III. Use for 'gasté', 'pagué', 'compré', 'recibí', 'transferí'.",
  parameters: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        enum: ['withdrawal', 'deposit', 'transfer'],
        description:
          'Transaction type: withdrawal (expense), deposit (income), transfer',
      },
      amount: {
        type: 'number',
        description: 'Transaction amount (positive number)',
      },
      description: {
        type: 'string',
        description: 'What was this transaction for',
      },
      account: {
        type: 'string',
        description: "Source account name (e.g., 'Checking', 'Savings')",
      },
      category: {
        type: 'string',
        description: "Optional category (e.g., 'Food', 'Transport')",
      },
      destination_account: {
        type: 'string',
        description: 'Destination account (required for transfers)',
      },
    },
    required: ['type', 'amount', 'description', 'account'],
  },

  createExecutor(client: FireflyClient) {
    return async (_id: string, params: TransactionInput) => {
      try {
        const result = await client.createTransaction(params);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            },
          ],
        };
      }
    };
  },
};
