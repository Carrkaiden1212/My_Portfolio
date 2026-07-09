import { spawn, type ChildProcess } from "node:child_process";
import { createReadStream } from "node:fs";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Readable } from "node:stream";

export function youtubeWatchUrl(video: { id?: string; url?: string }): string {
  if (video.url?.startsWith("http")) return video.url;
  if (video.id) return `https://www.youtube.com/watch?v=${video.id}`;
  throw new Error("Could not resolve YouTube video URL.");
}

export interface YoutubeStreamResult {
  stream: Readable;
  kill: () => void;
}
function runYtdlp(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc: ChildProcess = spawn("yt-dlp", args, { stdio: ["ignore", "ignore", "pipe"] });

    let stderr = "";
    proc.stderr?.on("data", (chunk: Buffer) => {
      const message = chunk.toString().trim();
      if (message) {
        stderr = `${stderr}\n${message}`;
        console.error("[yt-dlp]", message);
      }
    });

    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(stderr.trim() || `yt-dlp exited with code ${code}`));
    });
  });
}

export async function streamYoutube(url: string): Promise<YoutubeStreamResult> {
  const dir = await mkdtemp(join(tmpdir(), "music-bot-"));
  const outputTemplate = join(dir, "track.%(ext)s");

  await runYtdlp([
    "-f",
    "bestaudio[ext=webm][acodec=opus]/bestaudio[ext=webm]/bestaudio/best",
    "-o",
    outputTemplate,
    "--no-playlist",
    "--no-warnings",
    "--no-progress",
    url,
  ]);

  const files = await readdir(dir);  const audioFile = files.find((file) => file.startsWith("track."));
  if (!audioFile) {
    await rm(dir, { recursive: true, force: true });
    throw new Error("yt-dlp did not produce an audio file.");
  }

  const filePath = join(dir, audioFile);
  const stream = createReadStream(filePath);
  let cleaned = false;

  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    stream.destroy();
    void rm(dir, { recursive: true, force: true });
  };

  stream.on("close", cleanup);
  stream.on("error", cleanup);

  return {
    stream,
    kill: cleanup,
  };
}