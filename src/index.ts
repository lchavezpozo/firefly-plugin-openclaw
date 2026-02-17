/**
 * Firefly III Plugin for OpenClaw
 *
 * Personal finance management - check balances, record transactions, view spending.
 * https://github.com/lchavezpozo/firefly-plugin-openclaw
 */

import { FireflyClient } from './FireflyClient.js';
import {
  accountsTool,
  transactionTool,
  recentTool,
  deleteTool,
  summaryTool,
  categoriesTool,
} from './tools/index.js';
import type { FireflyConfig } from './types.js';

// All available tools
const tools = [
  accountsTool,
  transactionTool,
  recentTool,
  deleteTool,
  summaryTool,
  categoriesTool,
];

/**
 * OpenClaw Plugin Entry Point
 */
export default function (api: any) {
  const config: FireflyConfig =
    api.config?.plugins?.entries?.['firefly-iii']?.config || {};

  // Create client instance
  const client = new FireflyClient(config);

  // Register all tools
  for (const tool of tools) {
    api.registerTool({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
      execute: tool.createExecutor(client),
    });
  }
}

// Export for testing
export { FireflyClient } from './FireflyClient.js';
export * from './types.js';
