import { ITiledMapObject } from '@jonbell/tiled-map-type-guard';
import { nanoid } from 'nanoid';
import Player from '../lib/Player';
import { BoundingBox, TownEmitter, DanceArea as DanceAreaModel } from '../types/CoveyTownSocket';
import InteractableArea from './InteractableArea';

export default class DanceArea extends InteractableArea {
  private _music?: string;

  private _roundId: string;

  private _keySequence: number[];

  private _duration: number;

  private _points: Map<string, number>;

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
    this._points = points;
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
    this._points = updatedModel.points;
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
      points: this.points,
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
        music: undefined,
        roundId: nanoid(),
        // TODOO: this feels wrong.
        keySequence: [0, 0],
        duration: 20,
        points: new Map<string, number>(),
      },
      box,
      townEmitter,
    );
  }
}
