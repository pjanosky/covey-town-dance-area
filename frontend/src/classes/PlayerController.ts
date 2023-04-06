import EventEmitter from 'events';
import TypedEmitter from 'typed-emitter';
import { DanceMoveResult, Player as PlayerModel, PlayerLocation } from '../types/CoveyTownSocket';

export type PlayerEvents = {
  movement: (newLocation: PlayerLocation) => void;
};

export type PlayerGameObjects = {
  sprite: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  label: Phaser.GameObjects.Text;
  locationManagedByGameScene: boolean /* For the local player, the game scene will calculate the current location, and we should NOT apply updates when we receive events */;
};
export default class PlayerController extends (EventEmitter as new () => TypedEmitter<PlayerEvents>) {
  private _location: PlayerLocation;

  private readonly _id: string;

  private readonly _userName: string;

  public gameObjects?: PlayerGameObjects;

  private _isDancing: boolean;

  private _timer: ReturnType<typeof setTimeout> | undefined;

  constructor(id: string, userName: string, location: PlayerLocation) {
    super();
    this._id = id;
    this._userName = userName;
    this._location = location;
    this._isDancing = false;
  }

  set location(newLocation: PlayerLocation) {
    this._location = newLocation;
    this._updateGameComponentLocation();
    this.emit('movement', newLocation);
  }

  get location(): PlayerLocation {
    return this._location;
  }

  get userName(): string {
    return this._userName;
  }

  get id(): string {
    return this._id;
  }

  get isDancing(): boolean {
    return this._isDancing;
  }

  toPlayerModel(): PlayerModel {
    return { id: this.id, userName: this.userName, location: this.location };
  }

  private _updateGameComponentLocation() {
    if (this.gameObjects && !this.gameObjects.locationManagedByGameScene) {
      const { sprite, label } = this.gameObjects;
      if (!sprite.anims) return;
      sprite.setX(this.location.x);
      sprite.setY(this.location.y);
      label.setX(this.location.x);
      label.setY(this.location.y - 43);
      if (this.location.moving) {
        sprite.anims.play(`misa-${this.location.rotation}-walk`, true);
      } else {
        sprite.anims.stop();
        sprite.setTexture('atlas', `misa-${this.location.rotation}`);
      }
    }
  }

  // do a dance move: for all the other players in the town b/c the town game
  // scene focuses on a single player
  public doDanceMove(danceMoveResult: DanceMoveResult) {
    if (this.gameObjects) {
      const { sprite } = this.gameObjects;
      if (danceMoveResult.success) {
        this._isDancing = true;
        const keyPressed = danceMoveResult.keyPressed;
        if (keyPressed === 'one') {
          sprite.anims.play('misa-spin', true);
        } else if (keyPressed === 'two') {
          sprite.anims.play('misa-flip', true);
        } else if (keyPressed === 'three') {
          sprite.anims.play('misa-arms', true);
        } else if (keyPressed === 'four') {
          sprite.anims.play('misa-jump', true);
        }
        // if the wrong key is pressed, show the misa-fail animation
      } else {
        sprite.anims.play('misa-fail', true);
      }
      if (this._isDancing) {
        clearTimeout(this._timer);
        this._timer = setTimeout(() => {
          this._isDancing = false;
          sprite.anims.stop();
          // once the dance move is complete, misa is back to the front facing position
          this.gameObjects?.sprite.setTexture('atlas', 'misa-front');
        }, 500);
      }
    }
  }

  static fromPlayerModel(modelPlayer: PlayerModel): PlayerController {
    return new PlayerController(modelPlayer.id, modelPlayer.userName, modelPlayer.location);
  }
}
