import {
  AudioPlayer,
  AudioPlayerStatus,
  NoSubscriberBehavior,
  VoiceConnection,
  VoiceConnectionDisconnectReason,
  VoiceConnectionStatus,
  createAudioPlayer,
  createAudioResource,
  demuxProbe,
  entersState,
  joinVoiceChannel,
} from "@discordjs/voice";
import type { Guild, VoiceBasedChannel } from "discord.js";
import { once } from "node:events";
import play from "play-dl";
import { MusicQueue } from "./queue.js";
import type { Track } from "./types.js";
import { streamYoutube, youtubeWatchUrl } from "./youtube.js";

export class GuildMusicPlayer {
  readonly queue = new MusicQueue();
  private connection: VoiceConnection | null = null;
  private player: AudioPlayer;
  private playing = false;
  private paused = false;
  private killStream: (() => void) | null = null;

  constructor(private readonly guild: Guild) {
    this.player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Play,
        maxMissedFrames: 300,
      },
    });

    this.player.on(AudioPlayerStatus.Idle, () => {
      void this.playNext();
    });

    this.player.on("error", (error) => {
      console.error(`[${this.guild.id}] Audio player error:`, error.message);
      void this.playNext();
    });
  }

  get isPaused(): boolean {
    return this.paused;
  }

  get isPlaying(): boolean {
    return this.playing && !this.paused;
  }

  async connect(channel: VoiceBasedChannel): Promise<void> {
    if (this.connection) {
      this.connection.rejoin({
        channelId: channel.id,
        selfDeaf: false,
        selfMute: false,
      });
      await entersState(this.connection, VoiceConnectionStatus.Ready, 30_000);
      return;
    }

    this.connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
      selfDeaf: false,
      selfMute: false,
    });

    this.connection.subscribe(this.player);

    this.connection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
      try {
        if (
          newState.reason === VoiceConnectionDisconnectReason.WebSocketClose &&
          newState.closeCode === 4014
        ) {
          return;
        }

        await Promise.race([
          entersState(this.connection!, VoiceConnectionStatus.Signalling, 5_000),
          entersState(this.connection!, VoiceConnectionStatus.Connecting, 5_000),
        ]);
      } catch {
        this.destroy();
      }
    });

    await entersState(this.connection, VoiceConnectionStatus.Ready, 30_000);
  }

  async resolveQuery(query: string, requestedBy: string): Promise<Track[]> {
    const trimmed = query.trim();
    if (!trimmed) return [];

    if (play.yt_validate(trimmed) === "video") {
      const info = await play.video_info(trimmed);
      const details = info.video_details;
      return [
        {
          title: details.title ?? "Unknown title",
          url: youtubeWatchUrl(details),
          duration: details.durationInSec,
          thumbnail: details.thumbnails[0]?.url,
          requestedBy,
        },
      ];
    }

    if (play.yt_validate(trimmed) === "playlist") {
      const playlist = await play.playlist_info(trimmed, { incomplete: true });
      const videos = await playlist.all_videos();
      return videos.map((video) => ({
        title: video.title ?? "Unknown title",
        url: youtubeWatchUrl(video),
        duration: video.durationInSec,
        thumbnail: video.thumbnails[0]?.url,
        requestedBy,
      }));
    }

    if (play.sp_validate(trimmed) === "track") {
      const spotify = await play.spotify(trimmed);
      if (!("artists" in spotify)) {
        throw new Error("Only Spotify track links are supported.");
      }
      const artistName = spotify.artists[0]?.name ?? "";
      const search = await play.search(`${spotify.name} ${artistName}`, {
        limit: 1,
        source: { youtube: "video" },
      });
      if (search.length === 0) return [];
      const video = search[0]!;
      return [
        {
          title: `${spotify.name} — ${spotify.artists.map((artist) => artist.name).join(", ")}`,
          url: youtubeWatchUrl(video),
          duration: video.durationInSec,
          thumbnail: video.thumbnails[0]?.url ?? spotify.thumbnail?.url,
          requestedBy,
        },
      ];
    }

    const results = await play.search(trimmed, {
      limit: 1,
      source: { youtube: "video" },
    });

    if (results.length === 0) return [];

    const video = results[0]!;
    return [
      {
        title: video.title ?? trimmed,
        url: youtubeWatchUrl(video),
        duration: video.durationInSec,
        thumbnail: video.thumbnails[0]?.url,
        requestedBy,
      },
    ];
  }

  async enqueue(query: string, requestedBy: string): Promise<{ tracks: Track[]; position: number }> {
    const tracks = await this.resolveQuery(query, requestedBy);
    if (tracks.length === 0) {
      throw new Error("No results found for that query.");
    }

    const position =
      tracks.length === 1
        ? this.queue.enqueue(tracks[0]!)
        : this.queue.enqueueMany(tracks);

    if (!this.playing) {
      await this.startCurrent();
    }

    return { tracks, position };
  }

  pause(): boolean {
    if (!this.playing || this.paused) return false;
    this.player.pause();
    this.paused = true;
    return true;
  }

  resume(): boolean {
    if (!this.paused) return false;
    this.player.unpause();
    this.paused = false;
    return true;
  }

  async skip(): Promise<Track | undefined> {
    this.killActiveStream();
    this.player.stop();
    return this.queue.current;
  }

  stop(): void {
    this.killActiveStream();
    this.queue.clear();
    this.player.stop(true);
    this.playing = false;
    this.paused = false;
  }

  destroy(): void {
    this.stop();
    this.connection?.destroy();
    this.connection = null;
  }

  private killActiveStream(): void {
    this.killStream?.();
    this.killStream = null;
  }

  private async startCurrent(): Promise<void> {
    const track = this.queue.current;
    if (!track) {
      this.playing = false;
      this.paused = false;
      return;
    }

    if (!this.connection || this.connection.state.status !== VoiceConnectionStatus.Ready) {
      throw new Error("Voice connection is not ready. Try /play again.");
    }

    this.killActiveStream();

    const { stream, kill } = await streamYoutube(track.url);
    const probe = await demuxProbe(stream);
    this.killStream = () => {
      kill();
      probe.stream.destroy();
    };

    probe.stream.on("error", (error) => {
      console.error(`[${this.guild.id}] Stream error:`, error.message);
      this.killActiveStream();
      void this.playNext();
    });

    await once(probe.stream, "readable");

    const resource = createAudioResource(probe.stream, {
      inputType: probe.type,
      silencePaddingFrames: 5,
    });

    this.player.play(resource);
    this.playing = true;
    this.paused = false;

    await entersState(this.player, AudioPlayerStatus.Playing, 15_000);
  }

  private async playNext(): Promise<void> {
    const next = this.queue.advance();
    if (!next) {
      this.playing = false;
      this.paused = false;
      return;
    }

    await this.startCurrent();
  }
}

const players = new Map<string, GuildMusicPlayer>();

export function getPlayer(guild: Guild): GuildMusicPlayer {
  let player = players.get(guild.id);
  if (!player) {
    player = new GuildMusicPlayer(guild);
    players.set(guild.id, player);
  }
  return player;
}

export function destroyPlayer(guildId: string): void {
  const player = players.get(guildId);
  if (player) {
    player.destroy();
    players.delete(guildId);
  }
}
