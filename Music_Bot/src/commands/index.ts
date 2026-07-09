import {
  ChatInputCommandInteraction,
  Collection,
  REST,
  Routes,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";
import { config } from "../config.js";
import { helpCommand } from "./help.js";
import { leaveCommand } from "./leave.js";
import { nowplayingCommand } from "./nowplaying.js";
import { pauseCommand } from "./pause.js";
import { playCommand } from "./play.js";
import { queueCommand } from "./queue.js";
import { resumeCommand } from "./resume.js";
import { skipCommand } from "./skip.js";
import { stopCommand } from "./stop.js";

export interface BotCommand {
  data:
    | SlashCommandBuilder
    | SlashCommandOptionsOnlyBuilder
    | SlashCommandSubcommandsOnlyBuilder;
  execute(interaction: ChatInputCommandInteraction): Promise<void>;
}

export const commands: BotCommand[] = [
  playCommand,
  pauseCommand,
  resumeCommand,
  skipCommand,
  stopCommand,
  queueCommand,
  nowplayingCommand,
  leaveCommand,
  helpCommand,
];

export const commandMap = new Collection(
  commands.map((command) => [command.data.name, command]),
);

export async function registerCommands(clientId: string): Promise<void> {
  const rest = new REST().setToken(config.token);
  const body = commands.map((command) => command.data.toJSON());

  await rest.put(Routes.applicationGuildCommands(clientId, config.guildId), {
    body,
  });

  console.log(`Registered ${body.length} slash commands for guild ${config.guildId}`);
}
