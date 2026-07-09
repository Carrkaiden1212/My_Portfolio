import { SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "./index.js";
import { isUserAllowed } from "../config.js";
import { getPlayer } from "../music/player.js";
import { successEmbed } from "../utils/embeds.js";

export const skipCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Skip the current track"),

  async execute(interaction) {
    if (!isUserAllowed(interaction.user.id)) {
      await interaction.reply({
        content: "You are not allowed to control playback.",
        ephemeral: true,
      });
      return;
    }

    const player = getPlayer(interaction.guild!);
    if (!player.queue.current) {
      await interaction.reply({ content: "Nothing is playing.", ephemeral: true });
      return;
    }

    const skipped = player.queue.current.title;
    await player.skip();
    await interaction.reply({
      embeds: [successEmbed(`Skipped **${skipped}**.`)],
    });
  },
};
