import axios, { AxiosResponse } from 'axios';
import { IMusicClient } from './IMusicClient';
import { TrackInfo } from '../types/CoveyTownSocket';

const BASE_URL = 'https://api.spotify.com/v1';
const END_POINT = 'tracks';
const TOKEN_URL = 'https://accounts.spotify.com/api/token';

export default class SpotifyClient implements IMusicClient {
  private _expiration: Date | undefined;

  private _token: string | undefined;

  private _clientID: string | undefined;

  private _clientSecret: string | undefined;

  public constructor() {
    this._clientID = process.env.SPOTIFY_CLIENT_ID;
    this._clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  }

  public async getTrackData(url: string): Promise<TrackInfo | undefined> {
    if (!this._clientID || !this._clientSecret) {
      return undefined;
    }

    const now = new Date();
    if (!this._token || !this._expiration || now.getTime() > this._expiration.getTime()) {
      await this._requestNewToken();
    }
    if (!this._token) {
      return undefined;
    }
    const trackID = this._parseTrackID(url);
    if (trackID) {
      return this._makeApiRequest(url, trackID);
    }
    return undefined;
  }

  /**
   * Parses a track ID from a spotify track link
   */
  private _parseTrackID(url: string): string | undefined {
    if (url.indexOf('spotify.com') === -1 || url.indexOf('track') === -1) {
      return undefined;
    }

    const path = new URL(url).pathname;
    const trackIdIndex = path.lastIndexOf('/');
    if (trackIdIndex < 0 || trackIdIndex + 1 >= path.length) {
      return undefined;
    }
    return path.substring(trackIdIndex + 1);
  }

  /**
   * Makes a request to the spotify web API to request an API token.
   */
  private async _requestNewToken() {
    try {
      const response = await axios.post(
        TOKEN_URL,
        `grant_type=client_credentials&client_id=${this._clientID}&client_secret=${this._clientSecret}`,
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        },
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
    } catch (e) {
      this._token = undefined;
    }
  }

 /**
   * Makes a request to the spotify web API to request information about a track.
   */
  private async _makeApiRequest(trackUrl: string, trackId: string): Promise<TrackInfo | undefined> {
    const url = `${BASE_URL}/${END_POINT}/${trackId}`;
    try {
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${this._token}` },
      });

      if (response.status !== 200 || !response.data) {
        return undefined;
      }
      const artists: string[] = response.data.artists.map(
        (artist: { name: string }) => artist.name,
      );

      return {
        url: trackUrl,
        title: response.data.name,
        album: response.data.album?.name,
        artist: artists.join(', '),
        duration: response.data.duration_ms,
      };
    } catch (e) {
      return undefined;
    }
  }
}
