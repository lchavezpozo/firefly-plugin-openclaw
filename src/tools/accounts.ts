/**
 * Tool: firefly_accounts
 * Get all asset account balances
 */

import type { FireflyClient } from '../FireflyClient.js';

export const accountsTool = {
  name: 'firefly_accounts',
  description:
    "Get all asset account balances from Firefly III. Use when user asks about their money, balances, or 'cuánto tengo'.",
  parameters: {
    type: 'object',
    properties: {},
    required: [],
  },

  createExecutor(client: FireflyClient) {
    return async () => {
      const result = await client.getAccounts();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    };
  },
};
