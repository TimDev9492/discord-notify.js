import {
  Client,
  Events,
  GatewayIntentBits,
  Partials,
  TextChannel,
} from 'discord.js';
import { logger } from '.';

export class DiscordBot {
  private client: Client;
  private ready: boolean = false;

  constructor(token: string) {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
      ],
      partials: [Partials.Channel],
    });

    this.client.once(Events.ClientReady, (readyEvent) => {
      logger.info(`Discord bot logged in as ${readyEvent.user.tag}`);
      this.ready = true;
    });

    this.client.login(token);
  }

  isReady(): boolean {
    return this.ready;
  }

  async sendMessage(request: MessageRequest): Promise<MessageResponse> {
    if (!this.ready) {
      return {
        success: false,
        error: 'Bot is not ready yet',
      };
    }

    try {
      let parsedPayload = null;
      switch (request.type) {
        case 'embed': {
          parsedPayload = { embeds: [request.payload] };
          break;
        }
        case 'message': {
          parsedPayload = request.payload;
          break;
        }
        default: {
          return {
            success: false,
            error: `Unsupported type '${(request as any).type}'`,
          };
        }
      }

      // const channel = await this.client.channels.fetch(request.channelId);
      const channelSuccess: {
        [channelId: string]: boolean;
      } = {};

      const channeldIds = Array.isArray(request.channelIds) ? request.channelIds : [request.channelIds];

      for (const channelId of channeldIds) {
        channelSuccess[channelId] = true;
        const channel = await this.client.channels.fetch(channelId);

        if (!channel || !channel.isTextBased()) {
          channelSuccess[channelId] = false;
        }

        await (channel as TextChannel).send(parsedPayload);
      }

      return {
        success: Object.values(channelSuccess).includes(true),
        channelReport: channelSuccess,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  destroy() {
    this.client.destroy();
  }
}
