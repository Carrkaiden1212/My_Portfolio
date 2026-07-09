import { SlashCommandBuilder } from "discord.js";
import type { BotCommand } from "./index.js";
import { config, isUserAllowed } from "../config.js";
import { getPlayer } from "../music/player.js";
import { successEmbed, trackEmbed } from "../utils/embeds.js";

function requireVoice(interaction: Parameters<BotCommand["execute"]>[0]) {
  const member = interaction.guild?.members.cache.get(interaction.user.id);
  const channel = member?.voice.channel;
  if (!channel) {
    throw new Error("Join a voice channel first.");
  }
  if (!isUserAllowed(interaction.user.id)) {
    throw new Error("You are not allowed to control playback.");
  }
  return channel;
}

export const playCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play a song from YouTube or Spotify, or search by name")
    .addStringOption((option) =>
      option.setName("query").setDescription("URL or search terms").setRequired(true),
    ),

  async execute(interaction) {
    await interaction.deferReply();
    const channel = requireVoice(interaction);
    const query = interaction.options.getString("query", true);
    const player = getPlayer(interaction.guild!);

    await player.connect(channel);
    await interaction.editReply({ content: "Downloading audio…" });
    const { tracks, position } = await player.enqueue(query, interaction.user.id);

    if (tracks.length === 1) {
      const embed =
        position === 1
          ? trackEmbed(tracks[0]!, "Added to queue")
          : trackEmbed(tracks[0]!, `Queued — position #${position}`);
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    await interaction.editReply({
      embeds: [
        successEmbed(
          `Added **${tracks.length}** tracks from playlist to the queue.`,
        ),
      ],
    });
  },
};
