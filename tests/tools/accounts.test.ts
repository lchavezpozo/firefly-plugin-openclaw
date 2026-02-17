/**
 * Accounts Tool Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { accountsTool } from '../../src/tools/accounts.js';
import type { FireflyClient } from '../../src/FireflyClient.js';

describe('accountsTool', () => {
  it('should have correct metadata', () => {
    expect(accountsTool.name).toBe('firefly_accounts');
    expect(accountsTool.description).toContain('balances');
    expect(accountsTool.parameters.type).toBe('object');
  });

  it('should return formatted JSON response', async () => {
    const mockClient = {
      getAccounts: vi.fn().mockResolvedValue({
        accounts: [
          { name: 'Checking', balance: 1000, currency: '$' },
        ],
        total: 1000,
        currency: '$',
      }),
    } as unknown as FireflyClient;

    const executor = accountsTool.createExecutor(mockClient);
    const result = await executor();

    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              accounts: [{ name: 'Checking', balance: 1000, currency: '$' }],
              total: 1000,
              currency: '$',
            },
            null,
            2
          ),
        },
      ],
    });

    expect(mockClient.getAccounts).toHaveBeenCalledOnce();
  });
});
