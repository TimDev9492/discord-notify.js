import { APIEmbed } from "discord.js";

declare global {
  interface Config {
    DISCORD_BOT_TOKEN: string | undefined;
    PORT: number;
    LOG_DIRECTORY: string;
  }

  interface Environment {
    dev: Config;
    prod: Config;
  }

  interface BaseMessageRequest {
    channelIds: string[] | string;
    dismissLabel?: string;
    guildId?: string;
  }

  interface EmbedMessageRequest extends BaseMessageRequest {
    type: 'embed';
    payload: APIEmbed;
  }

  interface TextMessageRequest extends BaseMessageRequest {
    type: 'message';
    payload: string;
  }

  type MessageRequest = EmbedMessageRequest | TextMessageRequest;

  interface MessageResponse {
    success: boolean;
    channelReport?: {
      [channelId: string]: boolean;
    };
    error?: string;
  }
}

export {};
