import { clear } from 'console';
import { mock, mockClear } from 'jest-mock-extended';
import { nanoid } from 'nanoid';
import Player from '../lib/Player';
import { getLastEmittedEvent } from '../TestUtils';
import { DanceArea as DanceAreaModel, KeySequence, TownEmitter } from '../types/CoveyTownSocket';
import DanceArea from './DanceFloorArea';
import SpotifyClient from '../lib/SpotifyClient';

describe('DanceArea', () => {
  const testAreaBox = { x: 100, y: 100, width: 100, height: 100 };
  let testArea: DanceArea;
  const townEmitter = mock<TownEmitter>();
  let newPlayer: Player;
  const id = nanoid();
  const music: string[] = ['test song'];
  const roundId = nanoid();
  let keySequence: KeySequence;
  const duration = 20;
  let points: Record<string, number>;
  let playSongsSpy: jest.SpyInstance<Promise<void>, []>;

  beforeEach(() => {
    mockClear(townEmitter);
    testArea = new DanceArea(
      { id, music, roundId, keySequence, duration, points: {} },
      testAreaBox,
      townEmitter,
    );
    newPlayer = new Player(nanoid(), mock<TownEmitter>());
    testArea.add(newPlayer);
    points = { [newPlayer.id]: 0 };
    jest.useFakeTimers();
    playSongsSpy = jest.spyOn(DanceArea.prototype, 'playSongs').mockImplementation(async () => {});
    keySequence = testArea.keySequence;
  });
  afterEach(() => {
    testArea.remove(newPlayer);
    jest.clearAllTimers();
  });

  describe('Getters', () => {
    it('Gets current music', () => {
      expect(testArea.music).toEqual(music);
    });
    it('Gets current key sequence', () => {
      expect(testArea.keySequence).toEqual(keySequence);
    });
    it('Gets current duration', () => {
      expect(testArea.duration).toEqual(duration);
    });
    it('Gets current points', () => {
      expect(Object.fromEntries(testArea.points)).toEqual(points);
    });
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
        roundId: testArea.roundId,
        keySequence,
        duration,
        points: { [extraPlayer.id]: 0 },
      });
      testArea.remove(extraPlayer);
    });
    it("Clears the player's interactableID and emits an update for their location", () => {
      testArea.remove(newPlayer);
      expect(newPlayer.location.interactableID).toBeUndefined();
      const lastEmittedMovement = getLastEmittedEvent(townEmitter, 'playerMoved');
      expect(lastEmittedMovement.location.interactableID).toBeUndefined();
    });

    it('Clears all parameters when the last occupant leaves', () => {
      testArea.remove(newPlayer);
      const lastEmittedUpdate = getLastEmittedEvent(townEmitter, 'interactableUpdate');
      expect(lastEmittedUpdate).toEqual({
        id,
        music: [],
        roundId: undefined,
        keySequence: [],
        duration: 0,
        points: {},
      });

      expect(testArea.music).toEqual([]);
      expect(testArea.roundId).toEqual(undefined);
      expect(testArea.keySequence).toEqual([]);
      expect(testArea.duration).toEqual(0);
      expect(testArea.points.keys.length).toEqual(0);
    });
  });
  describe('add', () => {
    it('Adds the player to the occupants list', () => {
      expect(testArea.occupantsByID).toEqual([newPlayer.id]);
      expect(Object.fromEntries(testArea.points)).toEqual(points);
    });
    it("Sets the player's interactableID and emits an update for their location", () => {
      expect(newPlayer.location.interactableID).toEqual(id);

      const lastEmittedMovement = getLastEmittedEvent(townEmitter, 'playerMoved');
      expect(lastEmittedMovement.location.interactableID).toEqual(id);
    });
  });
  test('[OMG2 toModel] toModel sets the ID, music, roundId, keySequence, duration and points', () => {
    const model = testArea.toModel();
    expect(model.id).toEqual(id);
    expect(model.music).toEqual(music);
    expect(model.roundId).toEqual(testArea.roundId);
    expect(model.keySequence).toEqual(keySequence);
    expect(model.duration).toEqual(duration);
    expect(model.points).toEqual(points);
  });
  test('[OMG2 updateModel] updateModel sets music, roundId, keySequence, duration and points', () => {
    const newId = 'spam';
    const newMusic = ['random song'];
    const newRoundId = nanoid();
    const newKeySequence: KeySequence = ['one', 'two', 'three'];
    const newDuration = 45;
    const newPoints = { [newPlayer.id]: 23 };
    const newModel: DanceAreaModel = {
      id: newId,
      music: newMusic,
      roundId: newRoundId,
      keySequence: newKeySequence,
      duration: newDuration,
      points: newPoints,
    };
    testArea.updateModel(newModel);
    expect(testArea.music).toEqual(newMusic);
    expect(testArea.id).toBe(id);
    expect(testArea.roundId).toBe(newRoundId);
    expect(testArea.keySequence).toEqual(newKeySequence);
    expect(testArea.duration).toBe(newDuration);
    expect(Object.fromEntries(testArea.points)).toEqual(newPoints);
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
      // TODO: check implementation for expected initialization
      expect(val.boundingBox).toEqual({ x, y, width, height });
      expect(val.id).toEqual(name);
      expect(val.music).toEqual([]);
      expect(val.roundId).toEqual(undefined);
      expect(val.keySequence).toEqual([]);
      expect(val.duration).toEqual(0);
      expect(val.points).toEqual(new Map());
      expect(val.occupantsByID).toEqual([]);
    });
  });
  describe('playSongs', () => {
    it('play songs changes song after the duration of the song', async () => {
      const newMusic = ['song1', 'song2'];
      const model: DanceAreaModel = {
        id: testArea.id,
        music: newMusic,
        roundId: undefined,
        points: {},
        keySequence: [],
        duration: 0,
      };
      testArea.updateModel(model);

      playSongsSpy.mockRestore();
      const songDuration = 10000;
      jest.spyOn(SpotifyClient.prototype, 'getTrackData').mockImplementation(async _ => ({
        valid: true,
        duration: songDuration,
      }));

      await testArea.playSongs();
      expect(testArea.music).toEqual(newMusic);
      jest.advanceTimersByTime(songDuration + 5000);
      expect(testArea.music).toEqual(['song2']);
      jest.advanceTimersByTime(songDuration * 2);

      playSongsSpy.mockImplementation(async () => {});
    });
  });
});
