import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  Events,
  GatewayIntentBits,
  MessageCreateOptions,
  MessagePayload,
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

    this.client.once(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isButton()) return;

      if (interaction.customId === 'dismiss') {
        try {
          await interaction.message.delete();
        } catch (error) {
          await interaction.reply({
            content: 'Failed to delete the message.',
            flags: 'Ephemeral',
          });
        }
      }
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
      let parsedPayload: string | MessagePayload | MessageCreateOptions | null =
        null;
      switch (request.type) {
        case 'embed': {
          parsedPayload = { embeds: [request.payload], components: [] };
          if (request.dismissLabel) {
            const button = new ButtonBuilder()
              .setCustomId('dismiss')
              .setLabel(request.dismissLabel)
              .setStyle(ButtonStyle.Danger);

            const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
              button,
            );

            parsedPayload.components = [row];
          }
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

      const channeldIds = Array.isArray(request.channelIds)
        ? request.channelIds
        : [request.channelIds];

      for (const channelId of channeldIds) {
        channelSuccess[channelId] = true;
        const channel = await this.client.channels.fetch(channelId);

        if (!channel || !channel.isTextBased()) {
          channelSuccess[channelId] = false;
        }

        const sentMessage = await (channel as TextChannel).send(parsedPayload);
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
