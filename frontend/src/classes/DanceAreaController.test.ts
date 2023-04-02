import { mock, mockClear, MockProxy } from 'jest-mock-extended';
import { nanoid } from 'nanoid';
import TownController from './TownController';
import DanceAreaController, { DanceAreaEvents } from './DanceAreaController';
import { DanceArea, KeySequence } from '../types/CoveyTownSocket';

describe('DanceAreaController', () => {
  let testArea: DanceAreaController;
  let testAreaModel: DanceArea;
  const townController: MockProxy<TownController> = mock<TownController>();
  const mockListeners = mock<DanceAreaEvents>();
  beforeEach(() => {
    testAreaModel = {
      id: nanoid(),
      music: [],
      roundId: nanoid(),
      keySequence: [],
      duration: 0,
      points: {},
    };
    testArea = new DanceAreaController(testAreaModel);
    mockClear(townController);
    mockClear(mockListeners.musicChanged);
    mockClear(mockListeners.currentTrackChanged);
    mockClear(mockListeners.roundIdChanged);
    mockClear(mockListeners.keySequenceChanged);
    mockClear(mockListeners.durationChanged);
    mockClear(mockListeners.pointsChanged);
    mockClear(mockListeners.keyResultsChanged);
    mockClear(mockListeners.danceMove);
    testArea.addListener('musicChanged', mockListeners.musicChanged);
    testArea.addListener('currentTrackChanged', mockListeners.currentTrackChanged);
    testArea.addListener('roundIdChanged', mockListeners.roundIdChanged);
    testArea.addListener('keySequenceChanged', mockListeners.keySequenceChanged);
    testArea.addListener('durationChanged', mockListeners.durationChanged);
    testArea.addListener('pointsChanged', mockListeners.pointsChanged);
    testArea.addListener('keyResultsChanged', mockListeners.keyResultsChanged);
    testArea.addListener('danceMove', mockListeners.danceMove);
  });

  describe('Tests get and set for the music property', () => {
    test('updates the music property and emits a musicChanged event if the property changes', () => {
      const newMusic = ['charli XCX'];
      testArea.music = newMusic;
      expect(testArea.music).toEqual(['charli XCX']); // get check
      expect(mockListeners.musicChanged).toBeCalledWith(newMusic); // set check
    });
    test('does not emit an update if the music does not change', () => {
      testArea.music = testAreaModel.music;
      expect(mockListeners.musicChanged).not.toBeCalled();
    });
  });
  describe('Tests get for the currentTrack property', () => {
    test('updates the music property and emits a musicChanged event if the property changes', () => {
      const newMusic = ['charli XCX', 'vroom vroom'];
      testArea.music = newMusic;
      expect(testArea.currentTrack).toEqual('charli XCX');
      expect(mockListeners.currentTrackChanged).toBeCalledWith(newMusic[0]);
    });
    test('does not emit an update if the music does not change', () => {
      testArea.music = ['song1', 'song2', 'song3'];
      mockClear(mockListeners.currentTrackChanged);
      testArea.music = testArea.music.concat('song4');
      expect(mockListeners.currentTrackChanged).not.toBeCalled();
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
      const newKeySequence: KeySequence = ['one', 'two', 'three'];
      testArea.keySequence = newKeySequence;
      expect(testArea.keySequence).toEqual(['one', 'two', 'three']);
      expect(mockListeners.keySequenceChanged).toBeCalledWith(newKeySequence);
    });
    test('does not emit an update if the key sequence does not change', () => {
      testArea.keySequence = testAreaModel.keySequence;
      expect(mockListeners.keySequenceChanged).not.toBeCalled();
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
      testArea.points = new Map(Object.entries(testAreaModel.points));
      expect(mockListeners.pointsChanged).not.toBeCalled();
    });
  });
  describe('Test get and set for the keysPressed property', () => {
    test('updates the keysPressed property and emits a keysPressed event if the property changes', () => {
      const newKeysPressed = [true, false, true];
      testArea.keyResults = newKeysPressed;
      expect(testArea.keyResults).toEqual([true, false, true]);
      expect(mockListeners.keyResultsChanged).toBeCalledWith([true, false, true]);
    });
    test('does not emit an update if the keysPressed property does not change', () => {
      const originalKeysPressed = testArea.keyResults;
      testArea.keyResults = originalKeysPressed; // the keysPressed remain unchanged
      expect(mockListeners.keyResultsChanged).not.toBeCalled();
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
      const keySeq: KeySequence = ['one', 'two'];
      const newPoints = { player1: 10 };
      const newDanceAreaModel = {
        id: testAreaModel.id,
        music: ['Gaddi Red Challenger'],
        roundId: 'round 2',
        keySequence: keySeq,
        duration: 60,
        points: newPoints,
      };
      testArea.updateFrom(newDanceAreaModel);
      expect(testArea.music).toEqual(['Gaddi Red Challenger']);
      expect(testArea.roundId).toBe('round 2');
      expect(testArea.keySequence).toEqual(['one', 'two']);
      expect(testArea.duration).toBe(60);
      expect(testArea.points).toEqual(new Map(Object.entries(newPoints)));
    });
    test('does not update the id property as it is readonly', () => {
      const keySeq: KeySequence = ['one', 'two'];
      const existingId = testArea.id;
      const newPoints = { player1: 10 };
      const newDanceAreaModel = {
        id: nanoid(),
        music: ['Gaddi Red Challenger'],
        roundId: 'round 2',
        keySequence: keySeq,
        duration: 60,
        points: newPoints,
      };
      testArea.updateFrom(newDanceAreaModel);
      expect(testArea.id).toEqual(existingId);
    });
  });
  describe('getCurrentTrack', () => {
    it('getCurrentTrack returns the first track of there are track in the queue', () => {
      testArea.music = ['Roman Holiday', 'Chun Li', 'Good Form'];
      expect(testArea.currentTrack).toEqual('Roman Holiday');
    });
    it('getCurrentTrack returns the first track of there are track in the queue', () => {
      testArea.music = [];
      expect(testArea.currentTrack).toBeUndefined();
    });
  });
});
