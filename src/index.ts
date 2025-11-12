import { environment } from './config/config';
import express, { Request, Response } from 'express';
import { DiscordBot } from './bot';

let config: Config;
if (!process.env.ENV || !(process.env.ENV in environment)) {
  console.log('ERROR');
  process.exit(1);
} else {
  config = environment[process.env.ENV as keyof typeof environment];
}

const app = express();

if (!config.DISCORD_BOT_TOKEN) {
  console.error('DISCORD_BOT_TOKEN environment variable is required');
  process.exit(1);
}

// Initialize Discord bot
const bot = new DiscordBot(config.DISCORD_BOT_TOKEN);

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (_: Request, res: Response) => {
  res.json({
    status: 'ok',
    botReady: bot.isReady(),
  });
});

// Send message endpoint
app.post('/send', async (req: Request, res: Response) => {
  try {
    const request = req.body as MessageRequest;

    // Validate request
    if (!request.type || !request.channelId || !request.payload) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: type, channelId, and payload',
      });
    }

    if (request.type !== 'embed' && request.type !== 'message') {
      return res.status(400).json({
        success: false,
        error: 'Type must be either "embed" or "message"',
      });
    }

    if (request.type === 'message' && typeof request.payload !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Payload must be a string for message type',
      });
    }

    if (request.type === 'embed' && typeof request.payload !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Payload must be an object for embed type',
      });
    }

    // Send message via Discord bot
    const result = await bot.sendMessage(request);

    const statusCode = result.success ? 200 : 500;
    res.status(statusCode).json(result);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

// Start server
app.listen(config.PORT, () => {
  console.log(`Web server listening on port ${config.PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down...');
  bot.destroy();
  process.exit(0);
});
