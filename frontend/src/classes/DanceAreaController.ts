import { EventEmitter } from 'events';
import { useEffect, useState } from 'react';
import TypedEventEmitter from 'typed-emitter';
import {
  DanceMoveResult,
  DanceRating,
  KeySequence,
  NumberKey,
  TrackInfo,
} from '../types/CoveyTownSocket';
import { DanceArea as DanceAreaModel } from '../types/CoveyTownSocket';

/**
 * The events that a DanceAreaController can emit
 */
export type DanceAreaEvents = {
  /**
   * A musicChanged event indicates that a new song is playing in the DanceArea.
   * @param music the title of the new song
   */
  musicChanged: (music: TrackInfo[]) => void;

  /**
   * A currentTrackChanged indicates that the first track in the music queue has
   * changed.
   * @param music the first track in the queue
   */
  currentTrackChanged: (track: TrackInfo | undefined) => void;

  /**
   * A roundChanged event indicates that a new round has begun, with a new
   * unique ID.
   *
   * @param roundId the new unique ID
   */
  roundIdChanged: (roundId: string | undefined) => void;

  /**
   * A keySequenceChanged event indicates that there is a new key sequence for
   * the players to follow.
   *
   * @param keySequence the new list of numbers representing the sequence
   */
  keySequenceChanged: (keySequence: KeySequence) => void;

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
   * A keysPressedChanged event indicates that the keysPressed field has been updated/changed.
   *
   * @param keysPressed the updated list of keys pressed
   */
  keyResultsChanged: (keysPressed: KeyResult[]) => void;
};

/**
 * KeyResult records the result of pressing a specific key in a sequence.
 * It is undefined if the key was pressed, false of the wrong key was
 * pressed, and true if the right key was pressed.
 */
export type KeyResult = boolean | undefined;

/**
 * A DanceAreaController manages the state for a DanceArea in the frontend app,
 * serving as a bridge between the music being played + key sequence shown and the
 * backend TownService. The TownService ensures that the players' points increase
 * when they do the right dance moves and get rated.
 *
 * The DanceAreaController implements callbacks that handle events from the key
 * sequences and music in this browser window and emits updates when the state is
 * updated @see DanceAreaEvents
 */
export default class DanceAreaController extends (EventEmitter as new () => TypedEventEmitter<DanceAreaEvents>) {
  private _id: string;

  private _music: TrackInfo[];

  private _roundId: string | undefined;

  private _keySequence: KeySequence;

  private _duration: number;

  private _points: Map<string, number>;

  /** this list holds the keys the user has pressed */
  private _keyResults: KeyResult[];

  /** The timeout that is responsible for ending the current round */
  private _roundTimeout: NodeJS.Timeout | undefined;

  /**  The time the current round became active */
  private _roundStart: Date | undefined;

  /**
   * Constructs a new DanceAreaController, initialized with the state of the
   * provided danceAreaModel.
   *
   * @param danceAreaModel The dance area model that this controller should represent
   */
  constructor(model: DanceAreaModel) {
    super();
    this._id = model.id;
    this._music = model.music;
    this._roundId = model.roundId;
    this._keySequence = model.keySequence;
    this._duration = model.duration;
    this._points = new Map(Object.entries(model.points));
    this._keyResults = [];
  }

  /**
   * The ID of the dance area represented by this dance area controller
   * This property is read-only: once a DanceAreaController is created, it will always
   * be tied to the same ID.
   */
  public get id(): string {
    return this._id;
  }

  /**
   * The music of the dance area, or undefined when the first player joins the area.
   */
  public get music(): TrackInfo[] {
    return this._music;
  }

  /**
   * If the music changes, set it to the new music and emit an update.
   */
  public set music(music: TrackInfo[]) {
    const equal =
      this._music.length === music.length && this._music.every((track, i) => track === music[i]);
    if (!equal) {
      const currentTrack = this._music.length > 0 ? this._music[0] : undefined;
      const newCurrentTrack = music.length > 0 ? music[0] : undefined;
      if (currentTrack !== newCurrentTrack) {
        this._music = music;
        this.emit('currentTrackChanged', newCurrentTrack);
      }

      this._music = music;
      this.emit('musicChanged', music);
    }
  }

  /**
   * The round that is ongoing in the dance area.
   */
  public get roundId(): string | undefined {
    return this._roundId;
  }

  /**
   * If a new round has begun then we create a new round ID associated with it
   * and emit an update.
   */
  public set roundId(roundId: string | undefined) {
    if (this._roundId !== roundId) {
      this._roundId = roundId;
      this.emit('roundIdChanged', roundId);
    }
  }

  /**
   * The current key sequence that the player must follow.
   */
  public get keySequence(): KeySequence {
    return this._keySequence.slice();
  }

  /**
   * If there is a new key sequence then we change it and emit an update.
   */
  public set keySequence(keySequence: KeySequence) {
    const equal =
      this._keySequence.length === keySequence.length &&
      this._keySequence.every((key, i) => key === keySequence[i]);
    if (!equal) {
      this._keySequence = keySequence.slice();
      this.emit('keySequenceChanged', keySequence);
    }
  }

  /**
   * The duration (in seconds) of the current round.
   */
  public get duration(): number {
    return this._duration;
  }

  /**
   * If the duration of a round changes, then we make the change and emit
   * an update.
   */
  public set duration(duration: number) {
    if (this._duration !== duration) {
      this._duration = duration;
      this.emit('durationChanged', duration);
    }
  }

  /**
   * The amount points of each player currently in the dance area.
   */
  public get points(): Map<string, number> {
    return this._points;
  }

  /**
   * If the points change for any player(s), then we make the change and emit
   * an update.
   */
  public set points(points: Map<string, number>) {
    const same =
      this._points.size === points.size && [...this._points].every(([k, v]) => points.get(k) === v);
    if (!same) {
      this._points = points;
      this.emit('pointsChanged', points);
    }
  }

  /**
   * The keys the user has pressed so far.
   */
  public get keyResults(): KeyResult[] {
    return this._keyResults.slice();
  }

  /**
   * If the user presses a new key, then we can use this setter to add that key to the list of keys pressed.
   */
  public set keyResults(keyResults: KeyResult[]) {
    const equal =
      this._keyResults.length === keyResults.length &&
      this._keyResults.every((key, i) => key === keyResults[i]);
    if (!equal) {
      this._keyResults = keyResults.slice();
      this.emit('keyResultsChanged', this._keyResults);
    }
  }

  /**
   * @returns A DanceAreaModel that represents the current state of this DanceAreaController.
   */
  public danceAreaModel(): DanceAreaModel {
    return {
      id: this._id,
      music: this._music,
      roundId: this._roundId,
      keySequence: this._keySequence,
      duration: this._duration,
      points: Object.fromEntries(this._points),
    };
  }

  /**
   * Gets the timeout responsible for ending the active round.
   */
  public get roundTimeout(): NodeJS.Timeout | undefined {
    return this._roundTimeout;
  }

  /**
   * Sets the timeout responsible for ending the active round.
   */
  public set roundTimeout(timeout: NodeJS.Timeout | undefined) {
    this._roundTimeout = timeout;
  }

  /**
   * Gets the time that this round became active.
   */
  public get roundStart(): Date | undefined {
    return this._roundStart;
  }

  /**
   * Sets the time that this round became active.
   */
  public set roundStart(startTime: Date | undefined) {
    this._roundStart = startTime;
  }

  /**
   * Gets the first track in the queue if it's empty, otherwise returns undefined
   */
  public get currentTrack(): TrackInfo | undefined {
    if (this._music.length > 0) {
      return this._music[0];
    }
    return undefined;
  }

  /**
   * Applies updates to this dance area controller's model, setting the music,
   * roundId, keySequence, duration, and points.
   *
   * @param updatedModel the model from which we are getting the updated properties
   */
  public updateFrom(updatedModel: DanceAreaModel): void {
    this.music = updatedModel.music;
    this.keySequence = updatedModel.keySequence;
    this.duration = updatedModel.duration;
    this.points = new Map(Object.entries(updatedModel.points));
    this.roundId = updatedModel.roundId;
  }
}

/**
 * A hook that returns the music for the dance area with the given controller.
 *
 * @param controller the given controller
 * @returns a string representing the music
 */
export function useMusic(controller: DanceAreaController): TrackInfo[] {
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
 * A hook that returns first song in the queue from the dance controller.
 *
 * @param controller the given controller
 * @returns a string representing the music
 */
export function useCurrentTrack(controller: DanceAreaController): TrackInfo | undefined {
  const [track, setTrack] = useState(controller.currentTrack);
  useEffect(() => {
    controller.addListener('currentTrackChanged', setTrack);
    return () => {
      controller.removeListener('currentTrackChanged', setTrack);
    };
  }, [controller]);
  return track;
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
    controller.addListener('keySequenceChanged', setKeySequence);
    return () => {
      controller.removeListener('keySequenceChanged', setKeySequence);
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
export function useKeyResults(controller: DanceAreaController): KeyResult[] {
  const [keyResults, setKeyResults] = useState(controller.keyResults);
  useEffect(() => {
    controller.addListener('keyResultsChanged', setKeyResults);
    return () => {
      controller.removeListener('keyResultsChanged', setKeyResults);
    };
  }, [controller]);
  return keyResults;
}

/**
 * useActiveRound is a hook that returns the ID of the current active round. A
 * round is active if the current round ID is defined and the time time passed
 * since the start of the round is less than the duration.
 *
 * @returns The ID of the current round if there is one active otherwise undefined.
 */
export function useActiveRound(controller: DanceAreaController) {
  // initially undefined so a user will not have an active round if they join
  // a dance area in the middle of a round.
  const [activeRound, setActiveRound] = useState<string | undefined>(undefined);

  useEffect(() => {
    const onRoundChange = (roundID: string | undefined) => {
      setActiveRound(roundID);
      clearTimeout(controller.roundTimeout);
      if (roundID) {
        controller.roundTimeout = setTimeout(() => {
          setActiveRound(undefined);
        }, controller.duration * 1000 + 1);
        controller.keyResults = Array(controller.keySequence.length).fill(undefined);
      }
    };

    controller.addListener('roundIdChanged', onRoundChange);
    return () => {
      controller.removeListener('roundIdChanged', onRoundChange);
    };
  }, [controller]);

  return activeRound;
}
