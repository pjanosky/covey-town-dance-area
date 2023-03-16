import { mock, mockClear, MockProxy } from 'jest-mock-extended';
import { nanoid } from 'nanoid';
import TownController from './TownController';
import DanceAreaController, { DanceAreaEvents } from './DanceAreaController';
import { DanceArea } from '../types/CoveyTownSocket';

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
      points: new Map(),
    };
    testArea = new DanceAreaController(testAreaModel);
    mockClear(townController);
    mockClear(mockListeners.musicChanged);
    testArea.addListener('musicChanged', mockListeners.musicChanged);
  });

  describe('Setting music property', () => {
    test('updates the music property and emits a musicChanged event if the property changes', () => {
      const newMusic = nanoid();
      testArea.music = newMusic;
      expect(mockListeners.musicChanged).toBeCalledWith(newMusic);
    });
    test('does not emit an update if the music doees not change', () => {
      testArea.music = `${testAreaModel.music}`;
      expect(mockListeners.musicChanged).not.toBeCalled();
    });
  });
  describe('danceAreaModel', () => {
    test('Carries through all of the properties', () => {
      //
    });
  });
});
