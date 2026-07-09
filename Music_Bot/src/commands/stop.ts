import { SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "./index.js";
import { isUserAllowed } from "../config.js";
import { getPlayer } from "../music/player.js";
import { successEmbed } from "../utils/embeds.js";

export const stopCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("stop")
    .setDescription("Stop playback and clear the queue"),

  async execute(interaction) {
    if (!isUserAllowed(interaction.user.id)) {
      await interaction.reply({
        content: "You are not allowed to control playback.",
        ephemeral: true,
      });
      return;
    }

    const player = getPlayer(interaction.guild!);
    player.stop();
    await interaction.reply({ embeds: [successEmbed("Stopped and cleared the queue.")] });
  },
};
