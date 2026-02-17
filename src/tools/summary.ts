/**
 * Tool: firefly_summary
 * Get monthly financial summary
 */

import type { FireflyClient } from '../FireflyClient.js';

export const summaryTool = {
  name: 'firefly_summary',
  description:
    "Get a financial summary for the current month from Firefly III. Use for 'resumen del mes', 'cuánto gasté este mes'.",
  parameters: {
    type: 'object',
    properties: {},
    required: [],
  },

  createExecutor(client: FireflyClient) {
    return async () => {
      const summary = await client.getMonthlySummary();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(summary, null, 2),
          },
        ],
      };
    };
  },
};
