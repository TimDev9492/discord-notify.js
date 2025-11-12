import { Client, Events, GatewayIntentBits, Partials, TextChannel } from 'discord.js';

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
      console.log(`Discord bot logged in as ${readyEvent.user.tag}`);
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
      const channel = await this.client.channels.fetch(request.channelId);

      if (!channel || !channel.isTextBased()) {
        return {
          success: false,
          error: 'Channel not found or is not a text channel',
        };
      }

      let sentMessage;
      if (request.type === 'embed') {
        sentMessage = await (channel as TextChannel).send({ embeds: [request.payload] });
      } else if (request.type === 'message') {
        sentMessage = await (channel as TextChannel).send(request.payload);
      } else {
        return {
            success: false,
            error: `Unsupported type '${(request as any).type}'`,
        };
      }

      return {
        success: true,
        messageId: sentMessage.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  destroy() {
    this.client.destroy();
  }
}