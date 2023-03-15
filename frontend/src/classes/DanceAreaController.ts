import { EventEmitter } from 'events';
import { useEffect, useState } from 'react';
import TypedEventEmitter from 'typed-emitter';
// import { DanceArea as DanceAreaModel } from '../types/CoveyTownSocket';

/**
 * The events that a DanceAreaController can emit
 */
export type DanceAreaEvents = {
  // players points changed
  /**
   * A pointsChanged event indicates that the points for a certain player have been
   * changed.
   * @param playerId the id of the player whose points changed
   * @param points the points being added to the player's current points
   */
  pointsChanged: (playerId: string, points: number) => void;

  // key sequence --> should notify the players of the new sequnce
  /**
   * A newKeySequence event indicates that there is a new key sequence for the
   * players to follow.
   * @param sequence the new sequence for the players to follow
   * @returns a sequence of numbers representing different keys
   */
  newKeySequence: (sequence: number[]) => number[];

  // music change --> maybe we can notify the players of the music with a
  // toast message or string of some form
  /**
   * A musicChanged event indicates that a new song is playing in the DanceArea.
   * @param music the title of the new song
   */
  musicChanged: (music: string) => void;

  /*new round --> I feel like we can use numbers to keep track of the rounds
    and just increase the number when there is a new round. If no one is in the
    area, we can reset the round back to 0.
    newRound: (roundId: string) => void*/
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
