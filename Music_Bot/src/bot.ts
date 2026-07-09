import {
  Client,
  Events,
  GatewayIntentBits,
  Interaction,
} from "discord.js";
import { commandMap, registerCommands } from "./commands/index.js";
import { config } from "./config.js";
import { errorEmbed } from "./utils/embeds.js";

export function createClient(): Client {
  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
  });

  client.once(Events.ClientReady, async (readyClient) => {
    console.log(`Logged in as ${readyClient.user.tag}`);

    for (const guild of readyClient.guilds.cache.values()) {
      if (guild.id !== config.guildId) {
        console.log(`Leaving unauthorized guild: ${guild.name} (${guild.id})`);
        await guild.leave().catch(console.error);
      }
    }

    await registerCommands(readyClient.user.id);
    console.log(`Serving single guild: ${config.guildId}`);
  });

  client.on(Events.GuildCreate, async (guild) => {
    if (guild.id !== config.guildId) {
      console.log(`Rejected invite to guild: ${guild.name} (${guild.id})`);
      await guild.leave().catch(console.error);
    }
  });

  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.guildId !== config.guildId) {
      await interaction.reply({
        content: "This bot only works in its configured server.",
        ephemeral: true,
      });
      return;
    }

    const command = commandMap.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "An unexpected error occurred.";
      console.error(`Command /${interaction.commandName} failed:`, error);

      const payload = { embeds: [errorEmbed(message)], ephemeral: true };
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(payload);
      } else {
        await interaction.reply(payload);
      }
    }
  });

  return client;
}
