import axios from 'axios';
import SpotifyClient from './SpotifyClient';

describe('Test Spotify Client', () => {
  // save an restore environment variables
  let clientID: string | undefined;
  let clientSecret: string | undefined;

  beforeAll(() => {
    clientID = process.env.SPOTIFY_CLIENT_ID;
    clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  });

  afterAll(() => {
    process.env.SPOTIFY_CLIENT_ID = clientID;
    process.env.SPOTIFY_CLIENT_SECRET = clientSecret;
  });

  it('getTrackData returns undefined when spotify environment variables are not set', async () => {
    process.env.SPOTIFY_CLIENT_ID = undefined;
    process.env.SPOTIFY_CLIENT_SECRET = undefined;
    const client = new SpotifyClient();
    const trackData = await client.getTrackData(
      'https://open.spotify.com/track/0lsw4q8Jei7gEoV7kFe3DS',
    );
    expect(trackData).toBeUndefined();
  });

  it('getTrackData returns undefined when unable to get token', async () => {
    process.env.SPOTIFY_CLIENT_ID = 'test';
    process.env.SPOTIFY_CLIENT_SECRET = 'test';
    const client = new SpotifyClient();
    jest.spyOn(axios, 'post').mockImplementation(async (url, config) => ({}));
    const trackData = await client.getTrackData(
      'https://open.spotify.com/track/0lsw4q8Jei7gEoV7kFe3DS',
    );
    expect(trackData).toBeUndefined();
  });
  it('getTrackData return undefined for an invalid track', async () => {
    process.env.SPOTIFY_CLIENT_ID = 'test';
    process.env.SPOTIFY_CLIENT_SECRET = 'test';
    const client = new SpotifyClient();
    jest.spyOn(axios, 'post').mockImplementation(async (url, config) => ({
      status: 200,
      data: { access_token: 'token' },
    }));
    jest.spyOn(axios, 'get').mockImplementation(async (url, config) => ({ duration: 3 }));
    const trackData = await client.getTrackData('not a valid id');
    expect(trackData).toBeUndefined();
  });
  it('getTrackData return valid track info for an valid track', async () => {
    process.env.SPOTIFY_CLIENT_ID = 'test';
    process.env.SPOTIFY_CLIENT_SECRET = 'test';
    const client = new SpotifyClient();
    jest.spyOn(axios, 'post').mockImplementation(async (url, config) => ({
      status: 200,
      data: { access_token: 'token' },
    }));
    jest.spyOn(axios, 'get').mockImplementation(async (url, config) => ({
      status: 200,
      data: {
        duration_ms: 30,
        album: { name: 'album name' },
        name: 'track name',
        artists: [{ name: 'artist name' }],
      },
    }));
    const trackData = await client.getTrackData(
      'https://open.spotify.com/track/0lsw4q8Jei7gEoV7kFe3DS',
    );
    expect(trackData).toBeDefined();
  });
});
