# 🔥 Firefly III Plugin for OpenClaw

A native OpenClaw plugin for [Firefly III](https://www.firefly-iii.org/) - the self-hosted personal finance manager.

## Features

- 💰 **Check balances** - View all your asset accounts
- 📝 **Record transactions** - Log expenses, income, and transfers
- 📊 **View recent transactions** - See your latest activity
- 🗑️ **Delete transactions** - Remove incorrect entries
- 📈 **Monthly summary** - Get spending overview
- 🏷️ **List categories** - View all your categories

## Installation

```bash
openclaw plugins install @lchavezpozo/firefly-plugin-openclaw
```

Or clone manually:

```bash
git clone https://github.com/lchavezpozo/firefly-plugin-openclaw.git ~/.openclaw/plugins/firefly-iii
```

## Configuration

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
    "load": {
      "paths": ["~/.openclaw/plugins/firefly-iii"]
    },
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
          "credentialsPath": "/path/to/firefly-credentials.json"
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

## Usage

Once configured, the AI will automatically use these tools when you ask about finances:

- "How much money do I have?" → `firefly_accounts`
- "I spent $50 on groceries" → `firefly_transaction`
- "Show my recent expenses" → `firefly_recent`
- "Monthly spending summary" → `firefly_summary`

## Available Tools

| Tool | Description |
|------|-------------|
| `firefly_accounts` | Get all asset account balances |
| `firefly_transaction` | Record expense/income/transfer |
| `firefly_recent` | List recent transactions |
| `firefly_delete` | Delete a transaction by ID |
| `firefly_summary` | Get current month summary |
| `firefly_categories` | List all categories |

## Requirements

- OpenClaw 2026.2.0 or later
- Firefly III instance with API access
- Personal Access Token from Firefly III

## License

MIT © Luis Chavez

## Contributing

PRs welcome! Feel free to open issues for bugs or feature requests.
