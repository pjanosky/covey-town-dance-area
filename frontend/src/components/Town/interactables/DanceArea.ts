import Interactable, { KnownInteractableTypes } from '../Interactable';

/**
 * DanceArea handles all of the Phaser logic for a dance interactable
 * on the front end.
 */
export default class DanceArea extends Interactable {
  /**
   * The message that will be shown above the user's avatar when the come
   * close to the area
   */
  private _labelText?: Phaser.GameObjects.Text;

  /** Whether the user is currently interacting with this area. */
  private _isInteracting = false;

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

    const pressedNum = this._scene.getPressedNumber();
    if (pressedNum) {
      const danceController = this.townController.danceAreas.find(area => area.id === this.name);
      if (danceController) {
        danceController.emit('numberPressed', pressedNum);
      }
    }
  }

  overlapExit(): void {
    this._labelText?.setVisible(false);
    if (this._isInteracting) {
      this.townController.interactableEmitter.emit('endInteraction', this);
      this._isInteracting = false;
    }
  }

  interact(): void {
    this._labelText?.setVisible(false);
    this._isInteracting = true;
  }

  getType(): KnownInteractableTypes {
    return 'danceArea';
  }
}
