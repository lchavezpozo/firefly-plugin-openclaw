/**
 * Tool: firefly_delete
 * Delete a transaction by ID
 */

import type { FireflyClient } from '../FireflyClient.js';

interface DeleteParams {
  transaction_id: string;
}

export const deleteTool = {
  name: 'firefly_delete',
  description: 'Delete a transaction from Firefly III by its ID.',
  parameters: {
    type: 'object',
    properties: {
      transaction_id: {
        type: 'string',
        description: 'The transaction ID to delete',
      },
    },
    required: ['transaction_id'],
  },

  createExecutor(client: FireflyClient) {
    return async (_id: string, params: DeleteParams) => {
      await client.deleteTransaction(params.transaction_id);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              deleted: params.transaction_id,
            }),
          },
        ],
      };
    };
  },
};
