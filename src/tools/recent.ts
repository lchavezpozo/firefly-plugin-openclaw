/**
 * Tool: firefly_recent
 * Get recent transactions
 */

import type { FireflyClient } from '../FireflyClient.js';

interface RecentParams {
  limit?: number;
}

export const recentTool = {
  name: 'firefly_recent',
  description:
    "Get recent transactions from Firefly III. Use for 'últimos gastos', 'transacciones recientes', 'en qué gasté'.",
  parameters: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Number of transactions to return (default 10)',
      },
    },
    required: [],
  },

  createExecutor(client: FireflyClient) {
    return async (_id: string, params: RecentParams) => {
      const transactions = await client.getRecentTransactions(params.limit);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(transactions, null, 2),
          },
        ],
      };
    };
  },
};
