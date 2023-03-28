import axios from 'axios';
import { IMusicClient, TrackData } from './IMusicClient';

const BASE_URL = 'https://api.spotify.com/v1/';
const END_POINT = 'tracks';
const TOKEN_URL = 'https://accounts.spotify.com/api/token';

export default class SpotifyClient implements IMusicClient {
  private _expiration: Date | undefined;

  private _token: string | undefined;

  public async getTrackData(url: string): Promise<TrackData> {
    const now = new Date();
    if (!this._token || !this._expiration || now.getTime() > this._expiration.getTime()) {
      await this._requestNewToken();
    }
    if (!this._token) {
      return { valid: false };
    }
    const trackID = this._parseTrackID(url);
    if (trackID) {
      return this._makeApiRequest(trackID);
    }
    return { valid: false };
  }

  /**
   * Parses a track ID from a spotify track link
   */
  private _parseTrackID(url: string): string | undefined {
    const path = new URL(url).pathname;
    const trackIdIndex = path.lastIndexOf('/');
    if (trackIdIndex < 0 || trackIdIndex >= path.length) {
      return undefined;
    }
    return path.substring(trackIdIndex);
  }

  /**
   * Makes a request to the spotify web API to request an API token.
   */
  private async _requestNewToken() {
    const clientID = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    if (!clientID || !clientSecret) {
      throw Error('SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET environment variables must be set');
    }

    const response = await axios.post(
      TOKEN_URL,
      {
        grant_type: 'client_credentials',
        client_id: clientID,
        client_secret: clientSecret,
      },
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );
    if (response.status !== 200) {
      return;
    }

    const expiresIn = response.data.expires_in;
    if (expiresIn) {
      this._expiration = new Date();
      this._expiration.setTime(this._expiration.getTime() + expiresIn);
    }
    this._token = response.data.access_token;
  }

  /**
   * Makes a request to the spotify web API to request information about a track.
   */
  private async _makeApiRequest(trackId: string): Promise<TrackData> {
    const url = `${BASE_URL}/${END_POINT}/${trackId}`;
    const response = await axios.post(url);
    if (response.status !== 200) {
      return {
        valid: false,
      };
    }
    return {
      valid: true,
      duration: response.data.duration_ms,
    };
  }
}
