import { SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "./index.js";
import { isUserAllowed } from "../config.js";
import { getPlayer } from "../music/player.js";
import { successEmbed } from "../utils/embeds.js";

export const resumeCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("resume")
    .setDescription("Resume playback"),

  async execute(interaction) {
    if (!isUserAllowed(interaction.user.id)) {
      await interaction.reply({
        content: "You are not allowed to control playback.",
        ephemeral: true,
      });
      return;
    }

    const player = getPlayer(interaction.guild!);
    if (!player.resume()) {
      await interaction.reply({ content: "Playback is not paused.", ephemeral: true });
      return;
    }

    await interaction.reply({ embeds: [successEmbed("Playback resumed.")] });
  },
};
