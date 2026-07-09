# Discord Music Bot

## Requirements

- Node.js 20+
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) on your PATH

## Setup

1. Create a bot in the [Discord Developer Portal](https://discord.com/developers/applications) and copy the token.
2. Copy `.env.example` to `.env` and fill in `DISCORD_TOKEN` and `GUILD_ID`.
3. Invite the bot to one server only:

```
https://discord.com/api/oauth2/authorize?client_id=CLIENT_ID&permissions=36700160&scope=bot%20applications.commands
```

4. Install and run:

```bash
npm install
npm run dev
```

Production:

```bash
npm run build
npm start
```

## Commands
------------------------------------------------
| Command       | Description                  |
| --- | ---     |
| `/play`       | Play a URL or search YouTube |
| `/pause`      | Pause playback               |
| `/resume`     | Resume playback              |
| `/skip`       | Skip current track           |
| `/stop`       | Stop and clear queue         |
| `/queue`      | Show upcoming tracks         |
| `/nowplaying` | Current track info           |
| `/leave`      | Disconnect from voice        |
| `/help`       | List commands                |
------------------------------------------------
## Environment

| Variable           | Required         | Description |
| ---                | ---              | --- |
| `DISCORD_TOKEN`    | Yes              | Bot token |
| `GUILD_ID` | Yes   | Allowed guild ID |
| `ALLOWED_USER_IDS` | No | Comma-separated user IDs allowed to control playback.