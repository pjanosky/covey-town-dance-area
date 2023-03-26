/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { KeySequence } from './KeySequence';
import type { Record_string_number_ } from './Record_string_number_';

/**
 * DanceArea is the data model used to communicate the state of a DanceInteractableArea.
 */
export type DanceArea = {
    id: string;
    /**
     * The url or song id of the current song
     */
    music?: string;
    /**
     * An ID representing the current round
     */
    roundId: string;
    /**
     * The current number of
     */
    keySequence: KeySequence;
    /**
     * The duration of the current round in seconds
     */
    duration: number;
    /**
     * A map from each player's ID to the number of points they have
     */
    points: Record_string_number_;
};

