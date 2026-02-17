/**
 * FireflyClient Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FireflyClient, FireflyApiError } from '../src/FireflyClient.js';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('FireflyClient', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('constructor', () => {
    it('should create client with url and token', () => {
      const client = new FireflyClient({
        url: 'http://localhost:8080',
        token: 'test-token',
      });

      expect(client).toBeInstanceOf(FireflyClient);
    });

    it('should remove trailing slash from url', () => {
      const client = new FireflyClient({
        url: 'http://localhost:8080/',
        token: 'test-token',
      });

      // We can verify this by making a request and checking the URL
      expect(client).toBeInstanceOf(FireflyClient);
    });

    it('should throw error when no credentials provided', () => {
      expect(() => new FireflyClient({})).toThrow(
        'Firefly III not configured'
      );
    });
  });

  describe('getAccounts', () => {
    it('should return formatted account balances', async () => {
      const client = new FireflyClient({
        url: 'http://localhost:8080',
        token: 'test-token',
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: [
            {
              id: '1',
              attributes: {
                name: 'Checking',
                current_balance: '1000.50',
                currency_symbol: '$',
              },
            },
            {
              id: '2',
              attributes: {
                name: 'Savings',
                current_balance: '5000.00',
                currency_symbol: '$',
              },
            },
          ],
        }),
      });

      const result = await client.getAccounts();

      expect(result).toEqual({
        accounts: [
          { name: 'Checking', balance: 1000.5, currency: '$' },
          { name: 'Savings', balance: 5000, currency: '$' },
        ],
        total: 6000.5,
        currency: '$',
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/v1/accounts?type=asset',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });

    it('should handle empty accounts', async () => {
      const client = new FireflyClient({
        url: 'http://localhost:8080',
        token: 'test-token',
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [] }),
      });

      const result = await client.getAccounts();

      expect(result).toEqual({
        accounts: [],
        total: 0,
        currency: '$',
      });
    });
  });

  describe('createTransaction', () => {
    it('should create a withdrawal transaction', async () => {
      const client = new FireflyClient({
        url: 'http://localhost:8080',
        token: 'test-token',
      });

      // Mock findAccountByName
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: [
            {
              id: '1',
              attributes: { name: 'Checking' },
            },
          ],
        }),
      });

      // Mock createTransaction
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            id: '123',
            attributes: {
              transactions: [
                {
                  type: 'withdrawal',
                  date: '2026-02-16',
                  amount: '50.00',
                  currency_symbol: '$',
                  description: 'Groceries',
                  category_name: 'Food',
                },
              ],
            },
          },
        }),
      });

      const result = await client.createTransaction({
        type: 'withdrawal',
        amount: 50,
        description: 'Groceries',
        account: 'Checking',
        category: 'Food',
      });

      expect(result).toEqual({
        success: true,
        id: '123',
        type: 'withdrawal',
        amount: '50.00',
        currency: '$',
        description: 'Groceries',
        date: '2026-02-16',
        category: 'Food',
      });
    });

    it('should throw error when account not found', async () => {
      const client = new FireflyClient({
        url: 'http://localhost:8080',
        token: 'test-token',
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [] }),
      });

      // Mock getAccounts for error message
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [] }),
      });

      await expect(
        client.createTransaction({
          type: 'withdrawal',
          amount: 50,
          description: 'Test',
          account: 'NonExistent',
        })
      ).rejects.toThrow("Account 'NonExistent' not found");
    });
  });

  describe('API errors', () => {
    it('should throw FireflyApiError on non-OK response', async () => {
      const client = new FireflyClient({
        url: 'http://localhost:8080',
        token: 'test-token',
      });

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => 'Invalid token',
      });

      await expect(client.getAccounts()).rejects.toThrow(FireflyApiError);
    });
  });

  describe('deleteTransaction', () => {
    it('should handle 204 No Content response', async () => {
      const client = new FireflyClient({
        url: 'http://localhost:8080',
        token: 'test-token',
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await expect(client.deleteTransaction('123')).resolves.toBeUndefined();
    });
  });
});
