import { DanceMoveResult } from '../../../types/CoveyTownSocket';
import Interactable, { KnownInteractableTypes } from '../Interactable';
import { NumberKeyInputs } from '../TownGameScene';

/**
 * DanceArea handles all of the Phaser logic for a dance interactable
 * on the front end.
 */
export class DanceArea extends Interactable {
  /**
   * The message that will be shown above the user's avatar when the come
   * close to the area
   */
  private _labelText?: Phaser.GameObjects.Text;

  /** Whether the user is currently interacting with this area. */
  private _isInteracting = false;

  /** Whether the user currently has a number key pressed. */
  private _downKeys: Record<keyof NumberKeyInputs, boolean> = {
    one: false,
    two: false,
    three: false,
    four: false,
  };

  addedToScene() {
    super.addedToScene();
    this.setTintFill();
    this.setAlpha(0.3);

    this._labelText = this.scene.add.text(
      this.x - this.displayWidth / 2,
      this.y - this.displayHeight / 2,
      `Press space to enter the dance area`,
      { color: '#FFFFFF', backgroundColor: '#000000' },
    );
    this._labelText.setVisible(false);
    this.townController.getDanceAreaController(this);
    this.setDepth(-1);
  }

  overlap(): void {
    if (!this._labelText) {
      throw new Error('Should not be able to overlap with this interactable before added to scene');
    }
    const location = this.townController.ourPlayer.location;
    this._labelText.setX(location.x);
    this._labelText.setY(location.y);
    this._labelText.setVisible(true);
  }

  overlapExit(): void {
    this._labelText?.setVisible(false);
    if (this._isInteracting) {
      this.townController.interactableEmitter.emit('endInteraction', this);
      this._isInteracting = false;
    }
  }

  whileOverlapping(): void {
    let key: keyof NumberKeyInputs;
    for (key in this._scene.numberKeys) {
      const isDown = this._scene.numberKeys[key].isDown;
      const alreadyDown = this._downKeys[key];
      if (isDown) {
        if (!alreadyDown && !this.townController.paused) {
          this._downKeys[key] = true;
          const danceController = this.townController.danceAreas.find(
            area => area.id === this.name,
          );
          danceController?.emit('numberPressed', key);
        }
      } else {
        this._downKeys[key] = false;
      }
    }
  }

  interact(): void {
    this._labelText?.setVisible(false);
    this._isInteracting = true;
  }

  getType(): KnownInteractableTypes {
    return 'danceArea';
  }

  /**
   * Calls the passes an incoming dance move result to the town game scene.
   * @param danceMoveResult the incoming dance move result
   */
  doDanceMove(danceMoveResult: DanceMoveResult) {
    this._scene.doDanceMove(danceMoveResult);
  }
}
