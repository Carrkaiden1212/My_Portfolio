import { Colors, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "./index.js";
import { getPlayer } from "../music/player.js";
import { formatDuration } from "../music/types.js";

export const queueCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("queue")
    .setDescription("Show the current queue"),

  async execute(interaction) {
    const player = getPlayer(interaction.guild!);
    const { current, upcoming } = player.queue;

    if (!current && upcoming.length === 0) {
      await interaction.reply({ content: "The queue is empty.", ephemeral: true });
      return;
    }

    const lines: string[] = [];
    if (current) {
      lines.push(`**Now:** [${current.title}](${current.url}) \`(${formatDuration(current.duration)})\``);
    }

    const preview = upcoming.slice(0, 10);
    preview.forEach((track, index) => {
      lines.push(
        `**${index + 1}.** [${track.title}](${track.url}) \`(${formatDuration(track.duration)})\``,
      );
    });

    if (upcoming.length > 10) {
      lines.push(`\n*…and ${upcoming.length - 10} more*`);
    }

    const embed = new EmbedBuilder()
      .setColor(Colors.Blurple)
      .setTitle("Queue")
      .setDescription(lines.join("\n"))
      .setFooter({ text: `${upcoming.length} upcoming track(s)` });

    await interaction.reply({ embeds: [embed] });
  },
};
