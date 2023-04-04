/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * A data type representing information about a track.
 */
export type TrackInfo = {
    /**
     * The duration of the track in milliseconds.
     */
    duration?: number;
    /**
     * The artist the track belongs to
     */
    artist?: string;
    /**
     * The album it is on
     */
    album?: string;
    /**
     * The title of the song
     */
    title?: string;
    /**
     * The url of the track
     */
    url: string;
};

