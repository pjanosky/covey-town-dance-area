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

export type DanceMoveResult = {
  playerId: string;
  roundId: string;
  success: boolean;
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

/**
 * Represents a sequence of keys that the user needs to press to
 * perform a dance sequence.
 */
export type KeySequence = number[];

/**
 * DanceArea is the data model used to communicate the state of a DanceInteractableArea.
 */
export interface DanceArea {
  id: string;
  /** The url or song id of the current song */
  music: string;
  /** An ID representing the current round */
  roundId: string;
  /** The current number of  */
  keySequence: KeySequence;
  /** The duration of the current round in seconds */
  duration: number;
  /** A map from each player's ID to the number of points they have */
  points: Map<string, number>;
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
