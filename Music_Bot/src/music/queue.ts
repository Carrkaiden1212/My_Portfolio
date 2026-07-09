import type { Track } from "./types.js";

export class MusicQueue {
  readonly tracks: Track[] = [];
  private currentIndex = -1;
  loop = false;

  get current(): Track | undefined {
    return this.currentIndex >= 0 ? this.tracks[this.currentIndex] : undefined;
  }

  get upcoming(): Track[] {
    if (this.currentIndex < 0) return [...this.tracks];
    return this.tracks.slice(this.currentIndex + 1);
  }

  enqueue(track: Track): number {
    this.tracks.push(track);
    if (this.currentIndex === -1) {
      this.currentIndex = 0;
    }
    return this.tracks.length - this.currentIndex;
  }

  enqueueMany(tracks: Track[]): number {
    for (const track of tracks) {
      this.tracks.push(track);
    }
    if (this.currentIndex === -1 && this.tracks.length > 0) {
      this.currentIndex = 0;
    }
    return this.upcoming.length;
  }

  advance(): Track | undefined {
    if (this.tracks.length === 0) {
      this.currentIndex = -1;
      return undefined;
    }

    if (this.loop && this.currentIndex >= 0) {
      return this.current;
    }

    this.currentIndex += 1;
    if (this.currentIndex >= this.tracks.length) {
      this.currentIndex = -1;
      return undefined;
    }

    return this.current;
  }

  skipTo(index: number): Track | undefined {
    if (index < 0 || index >= this.tracks.length) return undefined;
    this.currentIndex = index;
    return this.current;
  }

  clear(): void {
    this.tracks.length = 0;
    this.currentIndex = -1;
    this.loop = false;
  }

  remove(index: number): boolean {
    if (index < 0 || index >= this.tracks.length) return false;

    this.tracks.splice(index, 1);

    if (this.tracks.length === 0) {
      this.currentIndex = -1;
      return true;
    }

    if (index < this.currentIndex) {
      this.currentIndex -= 1;
    } else if (index === this.currentIndex) {
      if (this.currentIndex >= this.tracks.length) {
        this.currentIndex = this.tracks.length - 1;
      }
    }

    return true;
  }
}
