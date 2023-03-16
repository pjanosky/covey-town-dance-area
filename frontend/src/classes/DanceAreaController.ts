import { EventEmitter } from 'events';
import { useEffect, useState } from 'react';
import TypedEventEmitter from 'typed-emitter';
import { KeySequence } from '../types/CoveyTownSocket';
import { DanceArea as DanceAreaModel } from '../types/CoveyTownSocket';

/**
 * The events that a DanceAreaController can emit
 */
export type DanceAreaEvents = {
  // The only client to server communication would be changing the music

  /**
   * A musicChanged event indicates that a new song is playing in the DanceArea.
   * @param music the title of the new song
   */
  musicChanged: (music: string | undefined) => void;
};

/**
 * A DanceAreaController manages the state for a DanceArea in the frontend app,
 * serving as a bridge between the music being played + key sequnence shown and the
 * backend TownService. The TownService ensures that the players' points increase
 * when they do the right dance moves and get rated.
 *
 * The DanceAreaController implements callbacks that handle events from the key
 * sequences and music in this browser window and emits updates when the state is
 * updated @see DanceAreaEvents
 */
export default class DanceAreaController extends (EventEmitter as new () => TypedEventEmitter<DanceAreaEvents>) {
  private _model: DanceAreaModel;

  private _roundId: string;

  private _keySequnce: KeySequence;

  private _duration: number;

  private _points: Map<string, number>;

  /**
   * Constructs a new DanceAreaController, initialized with the state of the
   * provided danceAreaModel.
   *
   * @param danceAreaModel The dance area model that this controller should represent
   */
  constructor(danceAreaModel: DanceAreaModel) {
    super();
    this._model = danceAreaModel;
    this._roundId = '';
    this._keySequnce = [];
    this._duration = 0;
    this._points = new Map();
  }

  /**
   * The ID of the dance area represented by this dance area controller
   * This property is read-only: once a DanceAreaController is created, it will always
   * be tied to the same ID.
   */
  public get id(): string {
    return this._model.id;
  }

  /**
   * The music of the dance area, or undefined when the first player joins the area.
   */
  public get music(): string | undefined {
    return this._model.music;
  }

  /**
   * If the music changes, set it to the new music and emit an update.
   */
  public set music(music: string | undefined) {
    if (this._model.music !== music) {
      this._model.music = music;
      this.emit('musicChanged', music);
    }
  }

  /**
   * The round that is ongoing in the dance area.
   */
  public get roundId(): string {
    return this._model.roundId;
  }

  /**
   * The current key sequence that the player must follow.
   */
  public get keySequence(): KeySequence {
    return this._model.keySequence;
  }

  /**
   * The duration (in seconds) of the current round.
   */
  public get duration(): number {
    return this._model.duration;
  }

  /**
   * The amount points of each player currently in the dance area.
   */
  public get points(): Map<string, number> {
    return this._model.points;
  }

  /**
   * @returns A DanceAreaModel that represents the current state of this DanceAreaController.
   */
  public danceAreaModel(): DanceAreaModel {
    return this._model;
  }

  /**
   * Applies updates to this dance area controller's model, setting the music,
   * roundId, keySequence, duration, and points.
   *
   * @param updatedModel the model from which we are getting the udpated properties
   */
  public updateFrom(updatedModel: DanceAreaModel): void {
    this.music = updatedModel.music;
    this._roundId = updatedModel.roundId;
    this._keySequnce = updatedModel.keySequence;
    this._duration = updatedModel.duration;
    this._points = updatedModel.points;
  }
}

/**
 * A hook that returns the music for the dance area with the given controller.
 *
 * @param controller the given controller
 * @returns a string representing the music
 */
export function useMusic(controller: DanceAreaController): string | undefined {
  const [music, setMusic] = useState(controller.music);
  useEffect(() => {
    controller.addListener('musicChanged', setMusic);
    return () => {
      controller.removeListener('musicChanged', setMusic);
    };
  }, [controller]);
  return music;
}
