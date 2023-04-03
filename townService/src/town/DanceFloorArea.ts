import { ITiledMapObject } from '@jonbell/tiled-map-type-guard';
import { IMusicClient } from '../lib/IMusicClient';
import Player from '../lib/Player';
import SpotifyClient from '../lib/SpotifyClient';
import {
  BoundingBox,
  TownEmitter,
  DanceArea as DanceAreaModel,
  KeySequence,
} from '../types/CoveyTownSocket';
import InteractableArea from './InteractableArea';

/** The duration to use for tracks where the duration can not be found in milliseconds */
const DEFAULT_TRACK_DURATION = 180000;
/** The time to wait in between songs in milliseconds */
const SONG_SPACING = 3000;

export default class DanceArea extends InteractableArea {
  private _music: string[];

  private _roundId: string | undefined;

  private _keySequence: KeySequence;

  private _duration: number;

  private _points: Map<string, number>;

  private _trackTimeout: NodeJS.Timeout | undefined;

  private _musicClient: IMusicClient = new SpotifyClient();

  private _playing = false;

  public get music() {
    return this._music;
  }

  public get roundId() {
    return this._roundId;
  }

  public get keySequence() {
    return this._keySequence;
  }

  public get duration() {
    return this._duration;
  }

  public get points() {
    return this._points;
  }

  /**
   * Creates a new DanceArea
   *
   * @param danceArea model containing this area's starting state
   * @param coordinates the bounding box that defines this viewing area
   * @param townEmitter a broadcast emitter that can be used to emit updates to players
   */
  public constructor(
    { id, music, roundId, keySequence, duration, points }: DanceAreaModel,
    coordinates: BoundingBox,
    townEmitter: TownEmitter,
  ) {
    super(id, coordinates, townEmitter);
    this._music = music;
    this._roundId = roundId;
    this._keySequence = keySequence;
    this._duration = duration;
    this._points = new Map(Object.entries(points));
  }

  /**
   * Removes a player from this dance session area.
   *
   * When the last player leaves, this method clears the music, and resets the points, roundId, keySequence and duration, and emits this update to all players in the Town.
   *
   * @param player
   */
  public remove(player: Player): void {
    super.remove(player);
    this.points.delete(player.id);
    if (this._occupants.length === 0) {
      this._music = [];
      this._roundId = '';
      this._keySequence = [];
      this._duration = 0;
      this._points.clear();
    }
    this._emitAreaChanged();
  }

  /**
   * Adds a player to this dance session area.
   *
   * @param player
   */
  public add(player: Player): void {
    super.add(player);
    this._points.set(player.id, 0);
    this._emitAreaChanged();
  }

  /**
   * Increments the points of the given player in the area by the given number
   *
   * @param player player in the area
   * @param pointInc number of points to increment by
   */
  public addPoints(player: Player, pointInc: number): void {
    const curPoints = this.points.get(player.id);
    const newPoints = curPoints ? curPoints + pointInc : pointInc;
    this._points.set(player.id, newPoints);
    this._emitAreaChanged();
  }

  /**
   * Updates the state of this PosterSessionArea, setting the poster, title, and stars properties
   *
   * @param posterSessionArea updated model
   */
  public updateModel(updatedModel: DanceAreaModel) {
    this._music = updatedModel.music;
    this._roundId = updatedModel.roundId;
    this._keySequence = updatedModel.keySequence;
    this._duration = updatedModel.duration;
    this._points = new Map(Object.entries(updatedModel.points));
    this.playSongs();
    this._emitAreaChanged();
  }

  /**
   * Convert this DanceArea instance to a simple DanceAreaModel suitable for
   * transporting over a socket to a client (i.e., serializable).
   */
  public toModel(): DanceAreaModel {
    return {
      id: this.id,
      music: this.music,
      roundId: this.roundId,
      keySequence: this.keySequence,
      duration: this.duration,
      points: Object.fromEntries(this.points),
    };
  }

  /**
   * Creates a new DanceArea object that will represent a DanceArea object in the town map.
   * @param mapObject An ITiledMapObject that represents a rectangle in which this dance area exists
   * @param townEmitter An emitter that can be used by this viewing area to broadcast updates to players in the town
   * @returns
   */
  public static fromMapObject(mapObject: ITiledMapObject, townEmitter: TownEmitter): DanceArea {
    if (!mapObject.width || !mapObject.height) {
      throw new Error('missing width/height for map object');
    }
    const box = {
      x: mapObject.x,
      y: mapObject.y,
      width: mapObject.width,
      height: mapObject.height,
    };
    return new DanceArea(
      {
        id: mapObject.name,
        music: [],
        roundId: '',
        keySequence: [],
        duration: 0,
        points: {},
      },
      box,
      townEmitter,
    );
  }

  /**
   * Plays all of the songs in the queue, removing each song after it is played.
   * Stops when the queue is empty. This method has no effect is music is
   * already playing.
   */
  public async playSongs() {
    if (this._playing) {
      return;
    }
    if (this.music.length === 0) {
      this._playing = false;
      return;
    }
    this._playing = true;
    const trackData = await this._musicClient?.getTrackData(this.music[0]);
    if (!trackData || trackData.valid) {
      // set a timer to go to the next song when this one finishes
      clearTimeout(this._trackTimeout);
      this._trackTimeout = setTimeout(() => {
        if (this._music.length > 0) {
          this._music = this._music.splice(1);
          this._emitAreaChanged();
        }
        this.playSongs();
      }, trackData?.duration ?? DEFAULT_TRACK_DURATION + SONG_SPACING);
    } else {
      // this song isn't valid, remove it from the queue
      this._music = this._music.splice(1);
      this._emitAreaChanged();
      this.playSongs();
    }
  }
}
