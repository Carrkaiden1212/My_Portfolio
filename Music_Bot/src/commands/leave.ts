import { SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "./index.js";
import { isUserAllowed } from "../config.js";
import { destroyPlayer } from "../music/player.js";
import { successEmbed } from "../utils/embeds.js";

export const leaveCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("leave")
    .setDescription("Disconnect from the voice channel"),

  async execute(interaction) {
    if (!isUserAllowed(interaction.user.id)) {
      await interaction.reply({
        content: "You are not allowed to control playback.",
        ephemeral: true,
      });
      return;
    }

    destroyPlayer(interaction.guild!.id);
    await interaction.reply({ embeds: [successEmbed("Left the voice channel.")] });
  },
};
