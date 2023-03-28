/**
 * A data type representing information about a track.
 */
export type TrackData = {
  /** Whether a given track link was a valid track */
  valid: boolean;
  /** The duration of the track in milliseconds. */
  duration?: number;
};

/**
 * An abstraction for a class responsible for getting information about songs.
 */
export interface IMusicClient {
  /**
   * Gets information about a song.
   * @param link The link to the song.
   */
  getTrackData(link: string): Promise<TrackData | undefined>;
}
