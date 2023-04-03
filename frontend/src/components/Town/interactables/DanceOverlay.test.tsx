import { ChakraProvider } from '@chakra-ui/react';
import { nanoid } from 'nanoid';
import TownController from '../../../classes/TownController';
import TownControllerContext from '../../../contexts/TownControllerContext';
import { mockTownController } from '../../../TestUtils';
import React from 'react';
import DanceAreaController from '../../../classes/DanceAreaController';
import { act } from 'react-dom/test-utils';
import { DeepMockProxy } from 'jest-mock-extended';
import { render, waitFor } from '@testing-library/react';
import { useHandleKeys } from './DanceOverlay';
import { DanceArea, DanceMoveResult } from '../../../types/CoveyTownSocket';
import PlayerController from '../../../classes/PlayerController';
import useTownController from '../../../hooks/useTownController';
import { calculateKeyIndex, DanceKeyViewer } from './DanceKeyView';

function HookComponent({ danceController }: { danceController: DanceAreaController }) {
  const townController = useTownController();
  useHandleKeys(danceController, townController);
  return <></>;
}

function RenderUseHandleKeys(
  danceController: DanceAreaController,
  townController: TownController,
): JSX.Element {
  return (
    <ChakraProvider>
      <TownControllerContext.Provider value={townController}>
        <HookComponent danceController={danceController}></HookComponent>
      </TownControllerContext.Provider>
    </ChakraProvider>
  );
}

function RenderDanceKeyViewer(
  danceController: DanceAreaController,
  townController: TownController,
): JSX.Element {
  return (
    <ChakraProvider>
      <TownControllerContext.Provider value={townController}>
        <DanceKeyViewer danceController={danceController}></DanceKeyViewer>
      </TownControllerContext.Provider>
    </ChakraProvider>
  );
}

describe('Dance Overlay Tests', () => {
  let danceArea: DanceArea;
  let danceController: DanceAreaController;
  let townController: DeepMockProxy<TownController>;
  let danceControllerDanceMoveSpy: jest.SpyInstance<void, [danceMoveResult: DanceMoveResult]>;
  let townControllerDanceMoveSpy: jest.SpyInstance<void, [danceMoveResult: DanceMoveResult]>;
  let ourPlayer: PlayerController;

  beforeEach(() => {
    danceArea = {
      id: nanoid(),
      music: [],
      roundId: nanoid(),
      duration: 5,
      keySequence: ['one', 'two', 'three'],
      points: {},
    };
    danceController = new DanceAreaController(danceArea);
    danceController.keyResults = [undefined, undefined, undefined];
    ourPlayer = new PlayerController(nanoid(), 'user123', {
      moving: false,
      rotation: 'front',
      x: 0,
      y: 0,
    });
    townController = mockTownController({ danceAreas: [danceController], ourPlayer: ourPlayer });
    townControllerDanceMoveSpy = jest.spyOn(townController, 'emitDanceMove');
    danceControllerDanceMoveSpy = jest.spyOn(townController, 'emitDanceMove');
  });

  describe('DanceKeyViewer', () => {
    it('The waiting message is shown when there is no active round', async () => {
      danceController.roundId = undefined;
      const renderData = render(RenderDanceKeyViewer(danceController, townController));
      expect(await renderData.findByText('Waiting for next round')).toBeVisible();
    });

    it('The key viewer shows the keys in the key sequence when there is an active round', async () => {
      const renderData = render(RenderDanceKeyViewer(danceController, townController));
      act(() => {
        danceController.roundStart = new Date();
        danceController.roundId = nanoid();
      });
      expect(await renderData.findByText('1')).toBeVisible();
      expect(await renderData.findByText('2')).toBeVisible();
      expect(await renderData.findByText('3')).toBeVisible();
    });
  });

  describe('calculateKeyIndex', () => {
    /**
     * Mocks the starting time of the round as timeDiff milliseconds before now.
     */
    const mockTime = (timeDiff: number) => {
      const startTime = new Date();
      danceController.roundStart = startTime;
      const timeSpy = jest.spyOn(startTime, 'getTime');
      const mock = jest.fn(() => new Date().getTime() - timeDiff);
      timeSpy.mockImplementation(mock);
    };

    it('calculateKeyIndex returns undefined when the round starting time is not set', () => {
      expect(calculateKeyIndex(danceController)).toBeUndefined();
    });

    it('calculateKeyIndex returns undefined when a key is not overlapping with the line', () => {
      mockTime(0);
      expect(calculateKeyIndex(danceController)).toBeUndefined();
    });

    it('calculateKeyIndex returns the correct index when a key is overlapping with the line', async () => {
      mockTime((danceController.duration * 1000) / 2 + 200);
      expect(calculateKeyIndex(danceController)).toBe(0);
    });
  });

  describe('useHandleKeys', () => {
    beforeEach(() => {
      render(RenderUseHandleKeys(danceController, townController));
      act(() => {
        danceController.roundStart = new Date();
      });
    });

    it('Emits successful dance move result when the right key is pressed', async () => {
      await waitFor(
        () => {
          expect(calculateKeyIndex(danceController)).toBeDefined();
        },
        { timeout: danceArea.duration * 1000 * 2 },
      );
      act(() => {
        danceController.emit('numberPressed', 'one');
      });

      const result: DanceMoveResult = {
        interactableID: danceController.id,
        playerId: townController.ourPlayer.id,
        success: true,
        roundId: danceArea.roundId,
        keyPressed: 'one',
      };
      expect(danceControllerDanceMoveSpy).toHaveBeenCalledWith(result);
      expect(townControllerDanceMoveSpy).toHaveBeenCalledWith(result);
      expect(danceController.keyResults).toEqual([true, undefined, undefined]);
    });

    it('Emits unsuccessful dance move result when the right key is pressed', async () => {
      await waitFor(
        () => {
          expect(calculateKeyIndex(danceController)).toBeDefined();
        },
        { timeout: danceArea.duration * 1000 * 2 },
      );
      act(() => {
        danceController.emit('numberPressed', 'four');
      });

      const result: DanceMoveResult = {
        interactableID: danceController.id,
        playerId: townController.ourPlayer.id,
        success: false,
        roundId: danceArea.roundId,
        keyPressed: 'four',
      };
      expect(danceControllerDanceMoveSpy).toHaveBeenCalledWith(result);
      expect(townControllerDanceMoveSpy).toHaveBeenCalledWith(result);
      expect(danceController.keyResults).toEqual([false, undefined, undefined]);
    });

    it('Does not emit a dance move result when there is no key overlapping with the line', async () => {
      await waitFor(
        () => {
          expect(calculateKeyIndex(danceController)).toBeUndefined();
        },
        { timeout: danceArea.duration * 1000 * 2 },
      );
      act(() => {
        danceController.emit('numberPressed', 'four');
      });

      expect(danceControllerDanceMoveSpy).not.toHaveBeenCalled();
      expect(townControllerDanceMoveSpy).not.toHaveBeenCalled();
      expect(danceController.keyResults).toEqual([undefined, undefined, undefined]);
    });
  });
});
