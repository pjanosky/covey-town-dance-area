import { mock, mockClear, MockProxy } from 'jest-mock-extended';
import { nanoid } from 'nanoid';
import TownController from './TownController';
import DanceAreaController, { DanceAreaEvents } from './DanceAreaController';
import {
  DanceArea,
  DanceMoveResult,
  NumberKey,
  Player,
  PlayerLocation,
} from '../types/CoveyTownSocket';
import { mockTownControllerConnection } from '../TestUtils';
describe('DanceAreaController', () => {
  let testArea: DanceAreaController;
  let testAreaModel: DanceArea;
  const townController: MockProxy<TownController> = mock<TownController>();
  const mockListeners = mock<DanceAreaEvents>();
  beforeEach(() => {
    testAreaModel = {
      id: nanoid(),
      music: nanoid(),
      roundId: nanoid(),
      keySequence: [],
      duration: 0,
      points: new Map<string, number>(),
    };
    testArea = new DanceAreaController(testAreaModel);
    mockClear(townController);
    mockClear(mockListeners.musicChanged);
    mockClear(mockListeners.roundIdChanged);
    mockClear(mockListeners.newKeySequence);
    mockClear(mockListeners.durationChanged);
    mockClear(mockListeners.pointsChanged);
    mockClear(mockListeners.keysPressed);
    mockClear(mockListeners.danceMove);
    testArea.addListener('musicChanged', mockListeners.musicChanged);
    testArea.addListener('roundIdChanged', mockListeners.roundIdChanged);
    testArea.addListener('newKeySequence', mockListeners.newKeySequence);
    testArea.addListener('durationChanged', mockListeners.durationChanged);
    testArea.addListener('pointsChanged', mockListeners.pointsChanged);
    testArea.addListener('keysPressed', mockListeners.keysPressed);
    testArea.addListener('danceMove', mockListeners.danceMove);
  });

  describe('Tests get and set for the music property', () => {
    test('updates the music property and emits a musicChanged event if the property changes', () => {
      const newMusic = 'charli XCX';
      testArea.music = newMusic;
      expect(testArea.music).toBe('charli XCX'); // get check
      expect(mockListeners.musicChanged).toBeCalledWith(newMusic); // set check
    });
    test('does not emit an update if the music doees not change', () => {
      testArea.music = `${testAreaModel.music}`;
      expect(mockListeners.musicChanged).not.toBeCalled();
    });
  });
  describe('Tests get and set for the roundId property', () => {
    test('updates the roundId property and emits a roundIdChanged event if the property changes', () => {
      const newRoundId = 'roundId';
      testArea.roundId = newRoundId;
      expect(testArea.roundId).toBe('roundId');
      expect(mockListeners.roundIdChanged).toBeCalledWith(newRoundId);
    });
    test('does not emit an update if the roundId does not change', () => {
      testArea.roundId = `${testAreaModel.roundId}`;
      expect(mockListeners.roundIdChanged).not.toBeCalled();
    });
  });
  describe('Tests get and set for the keySequence property', () => {
    test('updates the key sequence and emits a newKeySequence event if the property changes', () => {
      const newKeySequence: NumberKey[] = ['one', 'two', 'three'];
      testArea.keySequence = newKeySequence;
      expect(testArea.keySequence).toStrictEqual(['one', 'two', 'three']);
      expect(mockListeners.newKeySequence).toBeCalledWith(newKeySequence);
    });
    test('does not emit an update if the key sequence does not change', () => {
      testArea.keySequence = testAreaModel.keySequence;
      expect(mockListeners.newKeySequence).not.toBeCalled();
    });
  });
  describe('Tests get and set for the duration property', () => {
    test('updates the duration and emits a durationChanged event if the property changes', () => {
      const newDuration = 120;
      testArea.duration = newDuration;
      expect(testArea.duration).toBe(120);
      expect(mockListeners.durationChanged).toBeCalledWith(newDuration);
    });
    test('does not emit an update if the duration does not change', () => {
      testArea.duration = testAreaModel.duration;
      expect(mockListeners.durationChanged).not.toBeCalled();
    });
  });
  describe('Tests get and set for the points property', () => {
    test('updates the points and emits a pointsChanged event if the property changes', () => {
      const newPoints = new Map<string, number>();
      newPoints.set('player1', 50);
      newPoints.set('player2', 75);
      newPoints.set('player3', 10);
      testArea.points = newPoints;
      expect(testArea.points).toBe(newPoints);
      expect(mockListeners.pointsChanged).toBeCalledWith(newPoints);
    });
    test('does not emit an update if the points do not change', () => {
      testArea.points = testAreaModel.points;
      expect(mockListeners.pointsChanged).not.toBeCalled();
    });
  });
  describe('Test get and set for the keysPressed property', () => {
    test('updates the keysPressed property and emits a keysPressed event if the property changes', () => {
      const newKeysPressed: NumberKey[] = ['three', 'one', 'two'];
      testArea.keysPressed = newKeysPressed;
      expect(testArea.keysPressed).toStrictEqual(['three', 'one', 'two']);
      expect(mockListeners.keysPressed).toBeCalledWith(['three', 'one', 'two']);
    });
    test('does not emit an update if the keysPressed property does not change', () => {
      const originalKeysPressed = testArea.keysPressed;
      testArea.keysPressed = originalKeysPressed; // the keysPressed remain unchanged
      expect(mockListeners.keysPressed).not.toBeCalled();
    });
  });
  describe('danceAreaModel', () => {
    test('Carries through all of the properties', () => {
      const model = testArea.danceAreaModel();
      expect(model).toEqual(testAreaModel);
    });
  });
  describe('updateFrom', () => {
    test('Updates the music, roundId, keySequence, duration, and points properties', () => {
      const keySeq: NumberKey[] = ['one', 'two'];
      const newPoints = new Map<string, number>();
      newPoints.set('player1', 10);
      const newDanceAreaModel = {
        id: testAreaModel.id,
        music: 'Gaddi Red Challenger',
        roundId: 'round 2',
        keySequence: keySeq,
        duration: 60,
        points: newPoints,
      };
      testArea.updateFrom(newDanceAreaModel);
      expect(testArea.music).toBe('Gaddi Red Challenger');
      expect(testArea.roundId).toBe('round 2');
      expect(testArea.keySequence).toStrictEqual(['one', 'two']);
      expect(testArea.duration).toBe(60);
      expect(testArea.points).toBe(newPoints);
    });
    test('does not update the id property as it is readonly', () => {
      const keySeq: NumberKey[] = ['one', 'two'];
      const existingId = testArea.id;
      const newPoints = new Map<string, number>();
      newPoints.set('player1', 10);
      const newDanceAreaModel = {
        id: nanoid(),
        music: 'Gaddi Red Challenger',
        roundId: 'round 2',
        keySequence: keySeq,
        duration: 60,
        points: newPoints,
      };
      testArea.updateFrom(newDanceAreaModel);
      expect(testArea.id).toEqual(existingId);
    });
  });
});
