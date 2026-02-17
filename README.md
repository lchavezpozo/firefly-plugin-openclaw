# 🔥 Firefly III Plugin for OpenClaw

[![npm version](https://img.shields.io/npm/v/@lchavezpozo/firefly-plugin-openclaw.svg)](https://www.npmjs.com/package/@lchavezpozo/firefly-plugin-openclaw)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A native OpenClaw plugin for [Firefly III](https://www.firefly-iii.org/) — the self-hosted personal finance manager.

## ✨ Features

- 💰 **Check balances** — View all your asset accounts
- 📝 **Record transactions** — Log expenses, income, and transfers
- 📊 **View recent transactions** — See your latest activity
- 🗑️ **Delete transactions** — Remove incorrect entries
- 📈 **Monthly summary** — Get spending overview
- 🏷️ **List categories** — View all your categories

## 📦 Installation

```bash
openclaw plugins install @lchavezpozo/firefly-plugin-openclaw
```

Or install manually:

```bash
git clone https://github.com/lchavezpozo/firefly-plugin-openclaw.git ~/.openclaw/plugins/firefly-iii
```

## ⚙️ Configuration

### 1. Get your Firefly III API Token

1. Go to your Firefly III instance
2. Navigate to **Options** → **Profile** → **OAuth**
3. Create a new Personal Access Token
4. Copy the token

### 2. Configure the plugin

Add to your `~/.openclaw/openclaw.json`:

```json
{
  "plugins": {
    "entries": {
      "firefly-iii": {
        "enabled": true,
        "config": {
          "url": "http://your-firefly-instance:8080",
          "token": "your-api-token-here"
        }
      }
    }
  }
}
```

Or use a credentials file:

```json
{
  "plugins": {
    "entries": {
      "firefly-iii": {
        "enabled": true,
        "config": {
          "credentialsPath": "~/.openclaw/credentials/firefly.json"
        }
      }
    }
  }
}
```

Credentials file format:
```json
{
  "url": "http://your-firefly-instance:8080",
  "token": "your-api-token-here"
}
```

### 3. Restart OpenClaw

```bash
openclaw gateway restart
```

## 🚀 Usage

Once configured, the AI will automatically use these tools when you ask about finances:

| You say | Tool used |
|---------|-----------|
| "How much money do I have?" | `firefly_accounts` |
| "I spent $50 on groceries" | `firefly_transaction` |
| "Show my recent expenses" | `firefly_recent` |
| "Monthly spending summary" | `firefly_summary` |
| "What categories do I have?" | `firefly_categories` |

### Supported Languages

The plugin understands natural language in English and Spanish:
- "cuánto tengo" → `firefly_accounts`
- "gasté 50 en comida" → `firefly_transaction`
- "últimos gastos" → `firefly_recent`

## 🛠️ Available Tools

| Tool | Description |
|------|-------------|
| `firefly_accounts` | Get all asset account balances |
| `firefly_transaction` | Record expense/income/transfer |
| `firefly_recent` | List recent transactions |
| `firefly_delete` | Delete a transaction by ID |
| `firefly_summary` | Get current month summary |
| `firefly_categories` | List all categories |

## 🏗️ Architecture

```
src/
├── index.ts              # Plugin entry point
├── FireflyClient.ts      # API client class
├── types.ts              # TypeScript interfaces
└── tools/
    ├── accounts.ts       # Balance checking
    ├── transaction.ts    # Recording transactions
    ├── recent.ts         # Recent transactions
    ├── delete.ts         # Delete transactions
    ├── summary.ts        # Monthly summary
    └── categories.ts     # List categories
```

## 🧪 Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Type checking
npm run typecheck
```

## 📋 Requirements

- OpenClaw 2026.2.0 or later
- Firefly III instance with API access
- Personal Access Token from Firefly III
- Node.js 18+

## 📄 License

MIT © [Luis Chavez](https://github.com/lchavezpozo)

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Open issues for bugs or feature requests
- Submit pull requests
- Improve documentation

## 🔗 Links

- [Firefly III](https://www.firefly-iii.org/)
- [OpenClaw](https://openclaw.ai/)
- [npm Package](https://www.npmjs.com/package/@lchavezpozo/firefly-plugin-openclaw)
