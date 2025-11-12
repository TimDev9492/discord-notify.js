import { APIEmbed } from "discord.js";

declare global {
  interface Config {
    DISCORD_BOT_TOKEN: string | undefined;
    PORT: number;
  }

  interface Environment {
    dev: Config;
    prod: Config;
  }

  interface BaseMessageRequest {
    channelId: string;
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
    messageId?: string;
    error?: string;
  }
}

export {};
