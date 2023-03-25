import { EventEmitter } from 'events';
import { useEffect, useState } from 'react';
import TypedEventEmitter from 'typed-emitter';
import { DanceMoveResult, DanceRating, KeySequence, NumberKey } from '../types/CoveyTownSocket';
import { DanceArea as DanceAreaModel } from '../types/CoveyTownSocket';

/**
 * The events that a DanceAreaController can emit
 */
export type DanceAreaEvents = {
  /**
   * A musicChanged event indicates that a new song is playing in the DanceArea.
   * @param music the title of the new song
   */
  musicChanged: (music: string | undefined) => void;

  /**
   * A roundChanged event indicates that a new round has begun, with a new
   * unique ID.
   *
   * @param roundId the new unique ID
   */
  roundIdChanged: (roundId: string | undefined) => void;

  /**
   * A newKeySequence event indicates that there is a new key sequence for
   * the players to follow.
   *
   * @param keySequence the new list of numbers representing the sequence
   */
  newKeySequence: (keySequence: KeySequence) => void;

  /**
   * A durationChanged event indicates that a new round has begun with a set
   * duration.
   *
   * @param duration the set length of the round (in seconds)
   */
  durationChanged: (duration: number) => void;

  /**
   * A addPointsForPlayer event indicates that a specific player has gained
   * a specified amount of points.
   *
   * @param playerId the id of the player who won the points
   * @param pointsToAdd the number of points won
   */
  pointsChanged: (points: Map<string, number>) => void;

  /**
   * An event that indicates that another player has successfully or unsuccessfully performed
   * dance move.
   *
   * @param result: The result of the dance move that the other user performed
   */
  danceMove: (result: DanceMoveResult) => void;

  /**
   * An event that indicates that another player has rated our player's dancing.
   * @param rating the rating that the other player gave.
   */
  danceRating: (rating: DanceRating) => void;

  /**
   * An event that indicates that a number key has been pressed.
   *
   * @param key the key that was pressed
   */
  numberPressed: (key: NumberKey) => void;

  /**
   * A keysPressed event indicates that the keysPressed field has been updated/changed.
   *
   * @param keysPressed the updated list of keys pressed
   */
  keysPressed: (keysPressed: KeySequence) => void;
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

  // this list holds the keys the user has pressed
  private _keysPressed: KeySequence;

  /**
   * Constructs a new DanceAreaController, initialized with the state of the
   * provided danceAreaModel.
   *
   * @param danceAreaModel The dance area model that this controller should represent
   */
  constructor(danceAreaModel: DanceAreaModel) {
    super();
    this._model = danceAreaModel;
    this._keysPressed = [];
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
  public get roundId(): string | undefined {
    return this._model.roundId;
  }

  /**
   * If a new round has begun then we create a new round ID associated with it
   * and emit an update.
   */
  public set roundId(roundId: string | undefined) {
    if (this._model.roundId !== roundId) {
      this._model.roundId = roundId;
      this.emit('roundIdChanged', roundId);
    }
  }

  /**
   * The current key sequence that the player must follow.
   */
  public get keySequence(): KeySequence {
    return this._model.keySequence;
  }

  /**
   * If there is a new key sequence then we change it and emit an update.
   */
  public set keySequence(keySequence: KeySequence) {
    if (this._model.keySequence !== keySequence) {
      this._model.keySequence = keySequence;
      this.emit('newKeySequence', keySequence);
    }
  }

  /**
   * The duration (in seconds) of the current round.
   */
  public get duration(): number {
    return this._model.duration;
  }

  /**
   * If the duration of a round changes, then we make the change and emit
   * an update.
   */
  public set duration(duration: number) {
    if (this._model.duration !== duration) {
      this._model.duration = duration;
      this.emit('durationChanged', duration);
    }
  }

  /**
   * The amount points of each player currently in the dance area.
   */
  public get points(): Map<string, number> {
    return this._model.points;
  }

  /**
   * If the points change for any player(s), then we make the change and emit
   * an update.
   */
  public set points(points: Map<string, number>) {
    if (this._model.points !== points) {
      this._model.points = points;
      this.emit('pointsChanged', points);
    }
  }

  /**
   * The keys the user has pressed so far.
   */
  public get keysPressed(): KeySequence {
    return this._keysPressed;
  }

  /**
   * If the user presses a new key, then we can use this setter to add that key to the list of keys pressed.
   */
  public set keysPressed(keysPressed: KeySequence) {
    if (this._keysPressed !== keysPressed) {
      this._keysPressed = keysPressed;
      this.emit('keysPressed', keysPressed);
    }
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
    this.roundId = updatedModel.roundId;
    this.keySequence = updatedModel.keySequence;
    this.duration = updatedModel.duration;
    this.points = updatedModel.points;
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

/**
 * A hook that returns the current key sequence that the user must follow for the
 * dance area with the given controller.
 *
 * @param controller the given controller
 * @returns a list of numbers corresponding to the keys
 */
export function useKeySequence(controller: DanceAreaController): KeySequence {
  const [keySequence, setKeySequence] = useState(controller.keySequence);
  useEffect(() => {
    controller.addListener('newKeySequence', setKeySequence);
    return () => {
      controller.removeListener('newKeySequence', setKeySequence);
    };
  }, [controller]);
  return keySequence;
}

/**
 * A hook that returns the current keys pressed that the player has pressed for the
 * given dance area with the given controller.
 *
 * @param controller the given controller
 * @returns the list of numbers corresponding to the keys the user has pressed
 */
export function useKeysPressed(controller: DanceAreaController): KeySequence {
  const [keysPressed, setKeysPressed] = useState(controller.keysPressed);
  useEffect(() => {
    controller.addListener('keysPressed', setKeysPressed);
    return () => {
      controller.removeListener('keysPressed', setKeysPressed);
    };
  }, [controller]);
  return keysPressed;
}
