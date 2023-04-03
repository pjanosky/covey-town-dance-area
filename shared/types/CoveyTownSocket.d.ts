export type TownJoinResponse = {
  /** Unique ID that represents this player * */
  userID: string;
  /** Secret token that this player should use to authenticate
   * in future requests to this service * */
  sessionToken: string;
  /** Secret token that this player should use to authenticate
   * in future requests to the video service * */
  providerVideoToken: string;
  /** List of players currently in this town * */
  currentPlayers: Player[];
  /** Friendly name of this town * */
  friendlyName: string;
  /** Is this a private town? * */
  isPubliclyListed: boolean;
  /** Current state of interactables in this town */
  interactables: Interactable[];
};

export type Interactable =
  | ViewingArea
  | ConversationArea
  | PosterSessionArea
  | DanceArea;

export type TownSettingsUpdate = {
  friendlyName?: string;
  isPubliclyListed?: boolean;
};

export type Direction = "front" | "back" | "left" | "right";

export interface Player {
  id: string;
  userName: string;
  location: PlayerLocation;
}

export type XY = { x: number; y: number };

export interface PlayerLocation {
  /* The CENTER x coordinate of this player's location */
  x: number;
  /* The CENTER y coordinate of this player's location */
  y: number;
  /** @enum {string} */
  rotation: Direction;
  moving: boolean;
  interactableID?: string;
}
export type ChatMessage = {
  author: string;
  sid: string;
  body: string;
  dateCreated: Date;
  interactableId?: string;
};

/**
 * DanceMoveResult is a data type that store information about a dance
 * move that was successfully or unsuccessfully completed by a player.
 */
export type DanceMoveResult = {
  /** The id of the dance area that the player performed that dance move in */
  interactableID?: string;
  /** The id of the player that completed the move */
  playerId: string;
  /** The round that the player completed the move */
  roundId: string | undefined;
  /** Whether the move was completed successfully */
  success: boolean;
  /** The key that was pressed for this move */
  keyPressed: NumberKey;
};

/**
 * Rating represents the possible ratings a user can give to another users
 * in a Dance interactable area.
 */
export type Rating = 1 | 2 | 3 | 4 | 5;

/**
 * Rating is a data type that stores information about a rating that one
 * user can give to another user in a DanceInteractableArea.
 */
export type DanceRating = {
  /** The id of the dance area that the player performed that dance move in */
  interactableID?: string;
  /** The player ID of the sender */
  sender: string;
  /** The player ID of the recipient */
  recipient: string;
  /** The rating that the sender assigned to the recipient */
  rating: Rating;
};

export interface ConversationArea {
  id: string;
  topic?: string;
  occupantsByID: string[];
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ViewingArea {
  id: string;
  video?: string;
  isPlaying: boolean;
  elapsedTimeSec: number;
}

export interface PosterSessionArea {
  id: string;
  stars: number;
  imageContents?: string;
  title?: string;
}

/** All the possible number keys that we will detect. */
export type NumberKey =  string;
// "one" | "two" | "three" | "four";

/**
 * Represents a sequence of keys that the user needs to press to
 * perform a dance sequence.
 */
export type KeySequence = NumberKey[];

/**
 * DanceArea is the data model used to communicate the state of a DanceInteractableArea.
 */
export interface DanceArea {
  id: string;
  /** The url or song id of the current song. There will be no music playing
   * when the player joins the area (which is why music can be undefined).
   */
  music: string | undefined;
  /** An ID representing the current round. This will be undefined if there
   * is no active round.
   */
  roundId: string | undefined;
  /** The current number of  */
  keySequence: KeySequence;
  /** The duration of the current round in seconds */
  duration: number;
  /** A map from each player's ID to the number of points they have */
  points: Record<string, number>;
}

export interface ServerToClientEvents {
  playerMoved: (movedPlayer: Player) => void;
  playerDisconnect: (disconnectedPlayer: Player) => void;
  playerJoined: (newPlayer: Player) => void;
  initialize: (initialData: TownJoinResponse) => void;
  townSettingsUpdated: (update: TownSettingsUpdate) => void;
  townClosing: () => void;
  chatMessage: (message: ChatMessage) => void;
  interactableUpdate: (interactable: Interactable) => void;
  danceRating: (rating: DanceRating) => void;
  danceMove: (result: DanceMoveResult) => void;
}

export interface ClientToServerEvents {
  chatMessage: (message: ChatMessage) => void;
  playerMovement: (movementData: PlayerLocation) => void;
  interactableUpdate: (update: Interactable) => void;
  danceRating: (rating: DanceRating) => void;
  danceMove: (result: DanceMoveResult) => void;
}
