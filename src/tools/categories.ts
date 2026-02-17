/**
 * Tool: firefly_categories
 * List all spending categories
 */

import type { FireflyClient } from '../FireflyClient.js';

export const categoriesTool = {
  name: 'firefly_categories',
  description: 'List all spending categories from Firefly III.',
  parameters: {
    type: 'object',
    properties: {},
    required: [],
  },

  createExecutor(client: FireflyClient) {
    return async () => {
      const categories = await client.getCategories();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(categories, null, 2),
          },
        ],
      };
    };
  },
};
