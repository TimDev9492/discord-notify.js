import { environment } from './config/config';
import express, { Request, Response } from 'express';
import { DiscordBot } from './bot';
import winston from 'winston';
import DailyRotateFile, { DailyRotateFileTransportOptions } from 'winston-daily-rotate-file';

let config: Config;
if (!process.env.ENV || !(process.env.ENV in environment)) {
  console.log('Failed to load environment, exiting...');
  process.exit(1);
} else {
  config = environment[process.env.ENV as keyof typeof environment];
}

// setup logging
const rotateOptions: DailyRotateFileTransportOptions = {
  dirname: config.LOG_DIRECTORY,
  extension: '.log',
  datePattern: 'DD-MM-YYYY',
  zippedArchive: true,
  maxSize: '4m',
  maxFiles: '30d',
  createSymlink: true,
};

const infoRotateTransport = new DailyRotateFile({
  ...rotateOptions,
  filename: 'discord-notify-%DATE%-info',
  level: 'info',
  symlinkName: 'current-info.log',
} as DailyRotateFileTransportOptions);
const errorRotateTransport = new DailyRotateFile({
  ...rotateOptions,
  filename: 'discord-notify-%DATE%-error',
  level: 'error',
  symlinkName: 'current-error.log',
} as DailyRotateFileTransportOptions);

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    infoRotateTransport,
    errorRotateTransport,
    new winston.transports.Console({
      format: winston.format.prettyPrint({
        depth: 2,
        colorize: true,
      })
    })
  ],
  exitOnError: false,
});

const app = express();

if (!config.DISCORD_BOT_TOKEN) {
  logger.error('DISCORD_BOT_TOKEN environment variable is required');
  process.exit(1);
}

// Initialize Discord bot
const bot = new DiscordBot(config.DISCORD_BOT_TOKEN);

// Middleware
app.use(express.json());

// logging
app.use((req, res, next) => {
  const start = Date.now();

  // Log the request body (only after express.json has run)
  logger.info('Incoming request:', {
    method: req.method,
    url: req.originalUrl,
    body: req.body, // this works now because express.json() ran first
  });

  // Capture response
  const oldSend = res.send;
  res.send = (body) => {
    logger.info('Response:', {
      statusCode: res.statusCode,
      body: body,
    });
    return oldSend.call(res, body);
  };

  // When response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`Request to ${req.originalUrl} took ${duration}ms`);
  });

  next();
});

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
    if (!request.type || !request.channelIds || !request.payload) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: type, channelIds, and payload',
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
  logger.info(`Web server listening on port ${config.PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down...');
  bot.destroy();
  process.exit(0);
});
