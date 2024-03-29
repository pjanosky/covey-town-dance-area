import Phaser from 'phaser';
import PlayerController from '../../classes/PlayerController';
import TownController from '../../classes/TownController';
import { DanceMoveResult, NumberKey, PlayerLocation } from '../../types/CoveyTownSocket';
import { Callback } from '../VideoCall/VideoFrontend/types';
import Interactable from './Interactable';
import ConversationArea from './interactables/ConversationArea';
import Transporter from './interactables/Transporter';
import ViewingArea from './interactables/ViewingArea';
import PosterSessionArea from './interactables/PosterSessionArea';
import { DanceArea } from './interactables/DanceArea';

// Still not sure what the right type is here... "Interactable" doesn't do it
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function interactableTypeForObjectType(type: string): any {
  if (type === 'ConversationArea') {
    return ConversationArea;
  } else if (type === 'Transporter') {
    return Transporter;
  } else if (type == 'ViewingArea') {
    return ViewingArea;
  } else if (type == 'PosterSessionArea') {
    return PosterSessionArea;
  } else if (type == 'DanceArea') {
    return DanceArea;
  } else {
    throw new Error(`Unknown object type: ${type}`);
  }
}

/**
 * An object storing the current status of the keyboard keys 1, 2, 3, and 4.
 */
export type NumberKeyInputs = {
  one: Phaser.Input.Keyboard.Key;
  two: Phaser.Input.Keyboard.Key;
  three: Phaser.Input.Keyboard.Key;
  four: Phaser.Input.Keyboard.Key;
};

// Original inspiration and code from:
// https://medium.com/@michaelwesthadley/modular-game-worlds-in-phaser-3-tilemaps-1-958fc7e6bbd6

export default class TownGameScene extends Phaser.Scene {
  private _pendingOverlapExits = new Map<Interactable, () => void>();

  addOverlapExit(interactable: Interactable, callback: () => void) {
    this._pendingOverlapExits.set(interactable, callback);
  }

  private _players: PlayerController[] = [];

  private _interactables: Interactable[] = [];

  private _cursors: Phaser.Types.Input.Keyboard.CursorKeys[] = [];

  private _cursorKeys?: Phaser.Types.Input.Keyboard.CursorKeys;

  private _numberKeys: NumberKeyInputs | undefined;

  private _isDancing: boolean;

  private _animationKey: string;

  private _timer: ReturnType<typeof setTimeout> | undefined;

  /*
   * A "captured" key doesn't send events to the browser - they are trapped by Phaser
   * When pausing the game, we uncapture all keys, and when resuming, we re-capture them.
   * This is the list of keys that are currently captured by Phaser.
   */
  private _previouslyCapturedKeys: number[] = [];

  private _lastLocation?: PlayerLocation;

  private _ready = false;

  private _paused = false;

  public coveyTownController: TownController;

  private _onGameReadyListeners: Callback[] = [];

  private _gameIsReady = new Promise<void>(resolve => {
    if (this._ready) {
      resolve();
    } else {
      this._onGameReadyListeners.push(resolve);
    }
  });

  public get gameIsReady() {
    return this._gameIsReady;
  }

  public get cursorKeys() {
    const ret = this._cursorKeys;
    if (!ret) {
      throw new Error('Unable to access cursors before game scene is loaded');
    }
    return ret;
  }

  public get numberKeys() {
    const ret = this._numberKeys;
    if (!ret) {
      throw new Error('Unable to access number keys before game scene is loaded');
    }
    return ret;
  }

  private _resourcePathPrefix: string;

  constructor(coveyTownController: TownController, resourcePathPrefix = '') {
    super('TownGameScene');
    this._resourcePathPrefix = resourcePathPrefix;
    this.coveyTownController = coveyTownController;
    this._players = this.coveyTownController.players;
    this._isDancing = false;
    this._animationKey = 'misa-front';
  }

  preload() {
    this.load.image(
      'Room_Builder_32x32',
      this._resourcePathPrefix + '/assets/tilesets/Room_Builder_32x32.png',
    );
    this.load.image(
      '22_Museum_32x32',
      this._resourcePathPrefix + '/assets/tilesets/22_Museum_32x32.png',
    );
    this.load.image(
      '5_Classroom_and_library_32x32',
      this._resourcePathPrefix + '/assets/tilesets/5_Classroom_and_library_32x32.png',
    );
    this.load.image(
      '12_Kitchen_32x32',
      this._resourcePathPrefix + '/assets/tilesets/12_Kitchen_32x32.png',
    );
    this.load.image(
      '1_Generic_32x32',
      this._resourcePathPrefix + '/assets/tilesets/1_Generic_32x32.png',
    );
    this.load.image(
      '13_Conference_Hall_32x32',
      this._resourcePathPrefix + '/assets/tilesets/13_Conference_Hall_32x32.png',
    );
    this.load.image(
      '14_Basement_32x32',
      this._resourcePathPrefix + '/assets/tilesets/14_Basement_32x32.png',
    );
    this.load.image(
      '16_Grocery_store_32x32',
      this._resourcePathPrefix + '/assets/tilesets/16_Grocery_store_32x32.png',
    );
    this.load.image(
      'Dance_Tiles_32x32',
      this._resourcePathPrefix + '/assets/tilesets/Dance_Tiles_32x32.png',
    );
    this.load.tilemapTiledJSON('map', this._resourcePathPrefix + '/assets/tilemaps/indoors.json');
    this.load.atlas(
      'atlas',
      this._resourcePathPrefix + '/assets/atlas/atlas.png',
      this._resourcePathPrefix + '/assets/atlas/atlas.json',
    );
  }

  updatePlayers(players: PlayerController[]) {
    //Make sure that each player has sprites
    players.map(eachPlayer => this.createPlayerSprites(eachPlayer));

    // Remove disconnected players from board
    const disconnectedPlayers = this._players.filter(
      player => !players.find(p => p.id === player.id),
    );

    disconnectedPlayers.forEach(disconnectedPlayer => {
      if (disconnectedPlayer.gameObjects) {
        const { sprite, label } = disconnectedPlayer.gameObjects;
        if (sprite && label) {
          sprite.destroy();
          label.destroy();
        }
      }
    });
    // Remove disconnected players from list
    this._players = players;
  }

  getNewMovementDirection() {
    if (this._cursors.find(keySet => keySet.left?.isDown)) {
      return 'left';
    }
    if (this._cursors.find(keySet => keySet.right?.isDown)) {
      return 'right';
    }
    if (this._cursors.find(keySet => keySet.down?.isDown)) {
      return 'front';
    }
    if (this._cursors.find(keySet => keySet.up?.isDown)) {
      return 'back';
    }
    return undefined;
  }

  /**
   * Get the number key that is currently pressed with lower numbers taking
   * precedence over higher number of multiple keys are pressed at the same time.
   *
   * @returns The number key that is currently pressed of undefined if
   * no key is pressed.
   */
  getPressedNumber(): NumberKey | undefined {
    if (this._numberKeys?.one.isDown) {
      return 'one';
    } else if (this._numberKeys?.two.isDown) {
      return 'two';
    } else if (this._numberKeys?.three.isDown) {
      return 'three';
    } else if (this._numberKeys?.four.isDown) {
      return 'four';
    }
    return undefined;
  }

  // checks which key was pressed in the dance move result and assigns a dance move to each key
  doDanceMove(danceMoveResult: DanceMoveResult) {
    // check that our player is the one that emitted the dance move
    if (danceMoveResult.playerId === this.coveyTownController.ourPlayer.id) {
      this._isDancing = true;
      const keyPressed = danceMoveResult.keyPressed;
      const success = danceMoveResult.success;
      if (success) {
        if (keyPressed === 'one') {
          this._animationKey = 'misa-spin';
        } else if (keyPressed === 'two') {
          this._animationKey = 'misa-flip';
        } else if (keyPressed === 'three') {
          this._animationKey = 'misa-arms';
        } else if (keyPressed === 'four') {
          this._animationKey = 'misa-jump';
        }
        // if the wrong key is pressed, show the misa-fail animation
      } else {
        this._animationKey = 'misa-fail';
      }
      if (this._isDancing) {
        clearTimeout(this._timer);
        this._timer = setTimeout(() => {
          this._isDancing = false;
          // once the dance move is complete, misa is back to the front facing position
          const gameObjects = this.coveyTownController.ourPlayer.gameObjects;
          gameObjects?.sprite.anims.stop();
          gameObjects?.sprite.setTexture('atlas', 'misa-front');
        }, 500);
      }
    } else {
      // find the player that is dancing in the dance move result in the list
      // of players in the town
      const playerId = this.coveyTownController.players.find(
        player => player.id === danceMoveResult.playerId,
      );
      // if the player exists, do the dance move result
      if (playerId) {
        playerId.doDanceMove(danceMoveResult);
      }
    }
  }

  moveOurPlayerTo(destination: Partial<PlayerLocation>) {
    const gameObjects = this.coveyTownController.ourPlayer.gameObjects;
    if (!gameObjects) {
      throw new Error('Unable to move player without game objects created first');
    }
    if (!this._lastLocation) {
      this._lastLocation = { moving: false, rotation: 'front', x: 0, y: 0 };
    }
    if (destination.x !== undefined) {
      gameObjects.sprite.x = destination.x;
      this._lastLocation.x = destination.x;
    }
    if (destination.y !== undefined) {
      gameObjects.sprite.y = destination.y;
      this._lastLocation.y = destination.y;
    }
    if (destination.moving !== undefined) {
      this._lastLocation.moving = destination.moving;
    }
    if (destination.rotation !== undefined) {
      this._lastLocation.rotation = destination.rotation;
    }
    this.coveyTownController.emitMovement(this._lastLocation);
  }

  update() {
    if (this._paused) {
      return;
    }
    const gameObjects = this.coveyTownController.ourPlayer.gameObjects;
    if (gameObjects && this._cursors) {
      const speed = 175;

      const prevVelocity = gameObjects.sprite.body.velocity.clone();
      const body = gameObjects.sprite.body as Phaser.Physics.Arcade.Body;

      // Stop any previous movement from the last frame
      body.setVelocity(0);

      const primaryDirection = this.getNewMovementDirection();
      if (this._isDancing) {
        gameObjects.sprite.anims.play(this._animationKey, true);
      } else {
        switch (primaryDirection) {
          case 'left':
            body.setVelocityX(-speed);
            gameObjects.sprite.anims.play('misa-left-walk', true);
            break;
          case 'right':
            body.setVelocityX(speed);
            gameObjects.sprite.anims.play('misa-right-walk', true);
            break;
          case 'front':
            body.setVelocityY(speed);
            gameObjects.sprite.anims.play('misa-front-walk', true);
            break;
          case 'back':
            body.setVelocityY(-speed);
            gameObjects.sprite.anims.play('misa-back-walk', true);
            break;
          default:
            // Not moving
            gameObjects.sprite.anims.stop();
            // If we were moving, pick and idle frame to use
            if (prevVelocity.x < 0) {
              gameObjects.sprite.setTexture('atlas', 'misa-left');
            } else if (prevVelocity.x > 0) {
              gameObjects.sprite.setTexture('atlas', 'misa-right');
            } else if (prevVelocity.y < 0) {
              gameObjects.sprite.setTexture('atlas', 'misa-back');
            } else if (prevVelocity.y > 0) gameObjects.sprite.setTexture('atlas', 'misa-front');
            break;
        }
      }
      // Normalize and scale the velocity so that player can't move faster along a diagonal
      gameObjects.sprite.body.velocity.normalize().scale(speed);

      const isMoving = primaryDirection !== undefined;
      gameObjects.label.setX(body.x);
      gameObjects.label.setY(body.y - 43);
      const x = gameObjects.sprite.getBounds().centerX;
      const y = gameObjects.sprite.getBounds().centerY;
      //Move the sprite
      if (
        !this._lastLocation ||
        this._lastLocation.x !== x ||
        this._lastLocation.y !== y ||
        (isMoving && this._lastLocation.rotation !== primaryDirection) ||
        this._lastLocation.moving !== isMoving
      ) {
        if (!this._lastLocation) {
          this._lastLocation = {
            x,
            y,
            rotation: primaryDirection || 'front',
            moving: isMoving,
          };
        }
        this._lastLocation.x = x;
        this._lastLocation.y = y;
        this._lastLocation.rotation = primaryDirection || this._lastLocation.rotation || 'front';
        this._lastLocation.moving = isMoving;
        this._pendingOverlapExits.forEach((cb, interactable) => {
          if (
            !Phaser.Geom.Rectangle.Overlaps(
              interactable.getBounds(),
              gameObjects.sprite.getBounds(),
            )
          ) {
            this._pendingOverlapExits.delete(interactable);
            cb();
          }
        });
        this.coveyTownController.emitMovement(this._lastLocation);
      }
    }
  }

  private _map?: Phaser.Tilemaps.Tilemap;

  public get map(): Phaser.Tilemaps.Tilemap {
    const map = this._map;
    if (!map) {
      throw new Error('Cannot access map before it is initialized');
    }
    return map;
  }

  getInteractables(): Interactable[] {
    const typedObjects = this.map.filterObjects('Objects', obj => obj.type);
    const gameObjects = this.map.createFromObjects(
      'Objects',
      typedObjects.map(obj => ({
        id: obj.id,
        classType: interactableTypeForObjectType(obj.type),
      })),
    );

    return gameObjects as Interactable[];
  }

  create() {
    this._map = this.make.tilemap({ key: 'map' });

    /* Parameters are the name you gave the tileset in Tiled and then the key of the
         tileset image in Phaser's cache (i.e. the name you used in preload)
         */
    const tileset = [
      'Room_Builder_32x32',
      '22_Museum_32x32',
      '5_Classroom_and_library_32x32',
      '12_Kitchen_32x32',
      '1_Generic_32x32',
      '13_Conference_Hall_32x32',
      '14_Basement_32x32',
      '16_Grocery_store_32x32',
      'Dance_Tiles_32x32',
    ].map(v => this.map.addTilesetImage(v));

    // Parameters: layer name (or index) from Tiled, tileset, x, y
    const belowLayer = this.map.createLayer('Below Player', tileset, 0, 0);
    belowLayer.setDepth(-10);
    const wallsLayer = this.map.createLayer('Walls', tileset, 0, 0);
    const onTheWallsLayer = this.map.createLayer('On The Walls', tileset, 0, 0);
    wallsLayer.setCollisionByProperty({ collides: true });
    onTheWallsLayer.setCollisionByProperty({ collides: true });

    const worldLayer = this.map.createLayer('World', tileset, 0, 0);
    worldLayer.setCollisionByProperty({ collides: true });
    const aboveLayer = this.map.createLayer('Above Player', tileset, 0, 0);
    aboveLayer.setCollisionByProperty({ collides: true });

    const veryAboveLayer = this.map.createLayer('Very Above Player', tileset, 0, 0);
    /* By default, everything gets depth sorted on the screen in the order we created things.
         Here, we want the "Above Player" layer to sit on top of the player, so we explicitly give
         it a depth. Higher depths will sit on top of lower depth objects.
         */
    worldLayer.setDepth(5);
    aboveLayer.setDepth(10);
    veryAboveLayer.setDepth(15);

    // Object layers in Tiled let you embed extra info into a map - like a spawn point or custom
    // collision shapes. In the tmx file, there's an object layer with a point named "Spawn Point"
    const spawnPoint = this.map.findObject(
      'Objects',
      obj => obj.name === 'Spawn Point',
    ) as unknown as Phaser.GameObjects.Components.Transform;

    const labels = this.map.filterObjects('Objects', obj => obj.name === 'label');
    labels.forEach(label => {
      if (label.x && label.y) {
        this.add.text(label.x, label.y, label.text.text, {
          color: '#FFFFFF',
          backgroundColor: '#000000',
        });
      }
    });

    this._cursorKeys = this.input.keyboard.createCursorKeys();
    this._cursors.push(this._cursorKeys);
    this._cursors.push(
      this.input.keyboard.addKeys(
        {
          up: Phaser.Input.Keyboard.KeyCodes.W,
          down: Phaser.Input.Keyboard.KeyCodes.S,
          left: Phaser.Input.Keyboard.KeyCodes.A,
          right: Phaser.Input.Keyboard.KeyCodes.D,
        },
        false,
      ) as Phaser.Types.Input.Keyboard.CursorKeys,
    );
    this._cursors.push(
      this.input.keyboard.addKeys(
        {
          up: Phaser.Input.Keyboard.KeyCodes.H,
          down: Phaser.Input.Keyboard.KeyCodes.J,
          left: Phaser.Input.Keyboard.KeyCodes.K,
          right: Phaser.Input.Keyboard.KeyCodes.L,
        },
        false,
      ) as Phaser.Types.Input.Keyboard.CursorKeys,
    );

    /// Register the number keys for the dance interactable area
    this._numberKeys = this.input.keyboard.addKeys(
      {
        one: Phaser.Input.Keyboard.KeyCodes.ONE,
        two: Phaser.Input.Keyboard.KeyCodes.TWO,
        three: Phaser.Input.Keyboard.KeyCodes.THREE,
        four: Phaser.Input.Keyboard.KeyCodes.FOUR,
      },
      false,
    ) as NumberKeyInputs;

    // Create a sprite with physics enabled via the physics system. The image used for the sprite
    // has a bit of whitespace, so I'm using setSize & setOffset to control the size of the
    // player's body.
    const sprite = this.physics.add
      .sprite(spawnPoint.x, spawnPoint.y, 'atlas', 'misa-front')
      .setSize(30, 40)
      .setOffset(0, 24)
      .setDepth(6);
    const label = this.add
      .text(spawnPoint.x, spawnPoint.y - 43, '(You)', {
        font: '18px monospace',
        color: '#000000',
        // padding: {x: 20, y: 10},
        backgroundColor: '#ffffff',
      })
      .setDepth(6); // changing this to 1 put the notes in front of the (You) label
    this.coveyTownController.ourPlayer.gameObjects = {
      sprite,
      label,
      locationManagedByGameScene: true,
    };

    this._interactables = this.getInteractables();

    this.moveOurPlayerTo({ rotation: 'front', moving: false, x: spawnPoint.x, y: spawnPoint.y });

    // Watch the player and worldLayer for collisions, for the duration of the scene:
    this.physics.add.collider(sprite, worldLayer);
    this.physics.add.collider(sprite, wallsLayer);
    this.physics.add.collider(sprite, aboveLayer);
    this.physics.add.collider(sprite, onTheWallsLayer);

    // Create the player's walking animations from the texture atlas. These are stored in the global
    // animation manager so any sprite can access them.
    const { anims } = this;
    anims.create({
      key: 'misa-left-walk',
      frames: anims.generateFrameNames('atlas', {
        prefix: 'misa-left-walk.',
        start: 0, // specifies that the first frame should have index 0
        end: 3, // specifies that the first frame should have index 3
        zeroPad: 3, // the frame indices will be 000, 001, 002, 003
      }),
      frameRate: 10,
      repeat: -1,
    });
    anims.create({
      key: 'misa-right-walk',
      frames: anims.generateFrameNames('atlas', {
        prefix: 'misa-right-walk.',
        start: 0,
        end: 3,
        zeroPad: 3,
      }),
      frameRate: 10,
      repeat: -1,
    });
    anims.create({
      key: 'misa-front-walk',
      frames: anims.generateFrameNames('atlas', {
        prefix: 'misa-front-walk.',
        start: 0,
        end: 3,
        zeroPad: 3,
      }),
      frameRate: 10,
      repeat: -1,
    });
    anims.create({
      key: 'misa-back-walk',
      frames: anims.generateFrameNames('atlas', {
        prefix: 'misa-back-walk.',
        start: 0,
        end: 3,
        zeroPad: 3,
      }),
      frameRate: 10,
      repeat: -1,
    });

    // anim for 360 degree spin move
    anims.create({
      key: 'misa-spin', // name of the animation
      frames: anims.generateFrameNames('atlas', {
        prefix: 'misa-spin.', // the prefix of the name of the png
        start: 0, // the first frame has index 0
        end: 3, // last frame has index 1
        zeroPad: 3, // the frame indices will have 3 numbers (000, 001 in our case)
      }),
      frameRate: 10, // this value overrides the duration
      repeat: -1,
    });

    // anim for 180 degree flip move
    anims.create({
      key: 'misa-flip',
      frames: anims.generateFrameNames('atlas', {
        prefix: 'misa-flip.', // the prefix of the name of the png
        start: 0, // the first frame has index 0
        end: 1, // last frame has index 1
        zeroPad: 3, // the frame indices will have 3 numbers (000, 001 in our case)
      }),
      frameRate: 10,
      repeat: -1,
    });

    // anim for arm movement dance
    anims.create({
      key: 'misa-arms', // name of the animation
      frames: anims.generateFrameNames('atlas', {
        prefix: 'misa-arms-up.', // the prefix of the name of the png
        start: 0, // the first frame has index 0
        end: 1, // last frame has index 1
        zeroPad: 3, // the frame indices will have 3 numbers (000, 001 in our case)
      }),
      frameRate: 10,
      repeat: -1,
    });

    // anim for jump movement
    anims.create({
      key: 'misa-jump', // name of the animation
      frames: anims.generateFrameNames('atlas', {
        prefix: 'misa-jump.', // the prefix of the name of the png
        start: 0, // the first frame has index 0
        end: 4, // last frame has index 1
        zeroPad: 3, // the frame indices will have 3 numbers (000, 001 in our case)
      }),
      frameRate: 10,
      repeat: -1,
    });

    // anim for failed movement
    anims.create({
      key: 'misa-fail', // name of the animation
      frames: anims.generateFrameNames('atlas', {
        prefix: 'misa-fail.', // the prefix of the name of the png
        start: 0, // the first frame has index 0
        end: 0, // last frame has index 1
        zeroPad: 3, // the frame indices will have 3 numbers (000, 001 in our case)
      }),
      frameRate: 10,
      repeat: -1,
    });

    const camera = this.cameras.main;
    camera.startFollow(this.coveyTownController.ourPlayer.gameObjects.sprite);
    camera.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

    // Help text that has a "fixed" position on the screen
    this.add
      .text(16, 16, `Arrow keys to move`, {
        font: '18px monospace',
        color: '#000000',
        padding: {
          x: 20,
          y: 10,
        },
        backgroundColor: '#ffffff',
      })
      .setScrollFactor(0)
      .setDepth(30);

    this._ready = true;
    this.updatePlayers(this.coveyTownController.players);
    // Call any listeners that are waiting for the game to be initialized
    this._onGameReadyListeners.forEach(listener => listener());
    this._onGameReadyListeners = [];
    this.coveyTownController.addListener('playersChanged', players => this.updatePlayers(players));
  }

  createPlayerSprites(player: PlayerController) {
    if (!player.gameObjects) {
      const sprite = this.physics.add
        .sprite(player.location.x, player.location.y, 'atlas', 'misa-front')
        .setSize(30, 40)
        .setOffset(0, 24);
      const label = this.add.text(
        player.location.x,
        player.location.y - 43,
        player === this.coveyTownController.ourPlayer ? '(You)' : player.userName,
        {
          font: '18px monospace',
          color: '#000000',
          // padding: {x: 20, y: 10},
          backgroundColor: '#ffffff',
        },
      );
      player.gameObjects = {
        sprite,
        label,
        locationManagedByGameScene: false,
      };
    }
  }

  pause() {
    if (!this._paused) {
      this._paused = true;
      const gameObjects = this.coveyTownController.ourPlayer.gameObjects;
      if (gameObjects) {
        gameObjects.sprite.anims.stop();
        const body = gameObjects.sprite.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(0);
      }
      this._previouslyCapturedKeys = this.input.keyboard.getCaptures();
      this.input.keyboard.clearCaptures();
    }
  }

  resume() {
    if (this._paused) {
      this._paused = false;
      if (this.input && this.input.keyboard) {
        this.input.keyboard.addCapture(this._previouslyCapturedKeys);
      }
      this._previouslyCapturedKeys = [];
    }
  }
}
