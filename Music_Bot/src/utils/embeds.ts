import { Colors, EmbedBuilder } from "discord.js";
import type { Track } from "../music/types.js";
import { formatDuration } from "../music/types.js";

export function trackEmbed(track: Track, title = "Now Playing"): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(Colors.Blurple)
    .setTitle(title)
    .setDescription(`**[${track.title}](${track.url})**`)
    .addFields(
      { name: "Duration", value: formatDuration(track.duration), inline: true },
      { name: "Requested by", value: `<@${track.requestedBy}>`, inline: true },
    )
    .setThumbnail(track.thumbnail ?? null)
    .setTimestamp();
}

export function errorEmbed(message: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(Colors.Red)
    .setTitle("Something went wrong")
    .setDescription(message);
}

export function successEmbed(message: string): EmbedBuilder {
  return new EmbedBuilder().setColor(Colors.Green).setDescription(message);
}
