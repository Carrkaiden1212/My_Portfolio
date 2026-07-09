import { SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "./index.js";
import { getPlayer } from "../music/player.js";
import { trackEmbed } from "../utils/embeds.js";

export const nowplayingCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("nowplaying")
    .setDescription("Show the track that is currently playing"),

  async execute(interaction) {
    const player = getPlayer(interaction.guild!);
    const current = player.queue.current;

    if (!current) {
      await interaction.reply({ content: "Nothing is playing right now.", ephemeral: true });
      return;
    }

    await interaction.reply({ embeds: [trackEmbed(current)] });
  },
};
