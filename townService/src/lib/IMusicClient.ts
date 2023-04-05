import { TrackInfo } from '../types/CoveyTownSocket';

/**
 * An abstraction for a class responsible for getting information about songs.
 */
export interface IMusicClient {
  /**
   * Gets information about a song.
   * @param link The link to the song.
   * @returns the data associated with this song. Returns undefined if
   * making the web API request failed due to misconfiguration.
   */
  getTrackData(link: string): Promise<TrackInfo | undefined>;
}
