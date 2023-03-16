import { mock, mockClear } from 'jest-mock-extended';
import { nanoid } from 'nanoid';
import { readFileSync } from 'fs';
import Player from '../lib/Player';
import { getLastEmittedEvent } from '../TestUtils';
import { TownEmitter } from '../types/CoveyTownSocket';
import DanceArea from './DanceFloorArea';

describe('DanceArea', () => {
  const testAreaBox = { x: 100, y: 100, width: 100, height: 100 };
  let testArea: DanceArea;
  const townEmitter = mock<TownEmitter>();
  let newPlayer: Player;
  const id = nanoid();
  const music = nanoid();
  const roundId = nanoid();
  const keySequence: number[] = [];
  const duration = 20;
  let points: Map<string, number>;

  beforeEach(() => {
    mockClear(townEmitter);
    testArea = new DanceArea(
      { id, music, roundId, keySequence, duration, points: new Map() },
      testAreaBox,
      townEmitter,
    );
    newPlayer = new Player(nanoid(), mock<TownEmitter>());
    testArea.add(newPlayer);
    points = new Map([[newPlayer.id, 0]]);
  });

  describe('[OMG2 remove]', () => {
    it('Removes the player from the list of occupants and emits an interactableUpdate event', () => {
      // Add another player so that we are not also testing what happens when the last player leaves
      const extraPlayer = new Player(nanoid(), mock<TownEmitter>());
      const extraPoints = new Map([[extraPlayer.id, 0]]);
      testArea.add(extraPlayer);
      testArea.remove(newPlayer);

      expect(testArea.occupantsByID).toEqual([extraPlayer.id]);
      expect(testArea.points).toEqual(extraPoints);
      const lastEmittedUpdate = getLastEmittedEvent(townEmitter, 'interactableUpdate');
      expect(lastEmittedUpdate).toEqual({
        id,
        music,
        roundId,
        keySequence,
        duration,
        points: extraPoints,
      });
    });
    it("Clears the player's interactableID and emits an update for their location", () => {
      testArea.remove(newPlayer);
      expect(newPlayer.location.interactableID).toBeUndefined();
      const lastEmittedMovement = getLastEmittedEvent(townEmitter, 'playerMoved');
      expect(lastEmittedMovement.location.interactableID).toBeUndefined();
    });
    it('Clears the music and resets fields when the last occupant leaves', () => {
      testArea.remove(newPlayer);
      const lastEmittedUpdate = getLastEmittedEvent(townEmitter, 'interactableUpdate');
      expect(lastEmittedUpdate).toEqual({
        id,
        music: undefined,
        roundId: '',
        keySequence: [],
        duration: 0,
        points: new Map(),
      });
      expect(testArea.music).toBeUndefined();
      expect(testArea.roundId).toEqual('');
      expect(testArea.keySequence).toEqual([]);
      expect(testArea.duration).toEqual(0);
      expect(testArea.points).toEqual(new Map());
    });
  });
  describe('add', () => {
    it('Adds the player to the occupants list', () => {
      expect(testArea.occupantsByID).toEqual([newPlayer.id]);
      expect(testArea.points).toEqual(points);
    });
    it("Sets the player's interactableID and emits an update for their location", () => {
      expect(newPlayer.location.interactableID).toEqual(id);

      const lastEmittedMovement = getLastEmittedEvent(townEmitter, 'playerMoved');
      expect(lastEmittedMovement.location.interactableID).toEqual(id);
    });
  });
  test('[OMG2 toModel] toModel sets the ID, music, roundId, keySequence, duration and points', () => {
    const model = testArea.toModel();
    expect(model).toEqual({
      id,
      music,
      roundId,
      keySequence,
      duration,
      points,
    });
  });
  test('[OMG2 updateModel] updateModel sets music, roundId, keySequence, duration and points', () => {
    const newId = 'spam';
    const newMusic = 'random song';
    const newRoundId = nanoid();
    const newKeySequence = [0, 1, 2];
    const newDuration = 45;
    const newPoints = new Map([[newPlayer.id, 23]]);
    testArea.updateModel({
      id: newId,
      music: newMusic,
      roundId: newRoundId,
      keySequence: newKeySequence,
      duration: newDuration,
      points: newPoints,
    });
    expect(testArea.music).toBe(newMusic);
    expect(testArea.id).toBe(id);
    expect(testArea.roundId).toBe(newRoundId);
    expect(testArea.keySequence).toBe(newKeySequence);
    expect(testArea.duration).toBe(newDuration);
    expect(testArea.points).toBe(newPoints);
  });
  describe('[OMG2 fromMapObject]', () => {
    it('Throws an error if the width or height are missing', () => {
      expect(() =>
        DanceArea.fromMapObject({ id: 1, name: nanoid(), visible: true, x: 0, y: 0 }, townEmitter),
      ).toThrowError();
    });
    it('Creates a dance session area using the provided boundingBox and id, with no dance (i.e. music undefined, no points, roundId, duration), and emitter', () => {
      const x = 30;
      const y = 20;
      const width = 10;
      const height = 20;
      const name = 'name';
      const val = DanceArea.fromMapObject(
        { x, y, width, height, name, id: 10, visible: true },
        townEmitter,
      );
      expect(val.boundingBox).toEqual({ x, y, width, height });
      expect(val.id).toEqual(name);
      expect(val.music).toBeUndefined();
      expect(val.roundId).toEqual('');
      expect(val.keySequence).toEqual([]);
      expect(val.duration).toEqual(0);
      expect(val.points).toEqual(new Map());
      expect(val.occupantsByID).toEqual([]);
    });
  });
});
