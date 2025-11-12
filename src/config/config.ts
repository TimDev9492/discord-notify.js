import path from 'path';

export const environment: Environment = {
    dev: {
        DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
        PORT: 3000,
        LOG_DIRECTORY: process.env.LOG_DIRECTORY ?? path.join(__dirname, '..', '..', 'logs'),
    },
    prod: {
        DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
        PORT: 80,
        LOG_DIRECTORY: process.env.LOG_DIRECTORY ?? path.join(__dirname, '..', '..', 'logs'),
    }
}
