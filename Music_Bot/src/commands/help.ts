import { Colors, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "./index.js";

export const helpCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("List all music bot commands"),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(Colors.Blurple)
      .setTitle("Music Bot Commands")
      .setDescription("Join a voice channel, then use these slash commands:")
      .addFields(
        {
          name: "Playback",
          value: [
            "`/play <query>` — Play a YouTube/Spotify URL or search by name",
            "`/pause` — Pause the current track",
            "`/resume` — Resume playback",
            "`/skip` — Skip to the next track",
            "`/stop` — Stop and clear the queue",
          ].join("\n"),
        },
        {
          name: "Queue",
          value: [
            "`/queue` — Show upcoming tracks",
            "`/nowplaying` — Show the current track",
          ].join("\n"),
        },
        {
          name: "Voice",
          value: "`/leave` — Disconnect from the voice channel",
        },
      )
      .setFooter({ text: "You must be in a voice channel to use playback commands." });

    await interaction.reply({ embeds: [embed] });
  },
};
