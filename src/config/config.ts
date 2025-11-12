export const environment: Environment = {
    dev: {
        DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
        PORT: 3000,
    },
    prod: {
        DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
        PORT: 80,
    }
}
