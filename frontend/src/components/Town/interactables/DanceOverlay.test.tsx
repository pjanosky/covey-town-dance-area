import { ChakraProvider } from '@chakra-ui/react';
import { nanoid } from 'nanoid';
import TownController from '../../../classes/TownController';
import TownControllerContext from '../../../contexts/TownControllerContext';
import { mockTownController } from '../../../TestUtils';
import React from 'react';
import DanceAreaController from '../../../classes/DanceAreaController';
import { act } from 'react-dom/test-utils';
import { DeepMockProxy } from 'jest-mock-extended';
import { cleanup, render } from '@testing-library/react';
import { useHandleKeys } from './DanceOverlay';
import { DanceMoveResult, NumberKey } from '../../../types/CoveyTownSocket';
import PlayerController from '../../../classes/PlayerController';
import useTownController from '../../../hooks/useTownController';

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

describe('DanceAreaController Hooks', () => {
  let danceController: DanceAreaController;
  let townController: DeepMockProxy<TownController>;
  let danceControllerDanceMoveSpy: jest.SpyInstance<void, [danceMoveResult: DanceMoveResult]>;
  let townControllerDanceMoveSpy: jest.SpyInstance<void, [danceMoveResult: DanceMoveResult]>;
  let ourPlayer: PlayerController;

  beforeEach(() => {
    danceController = new DanceAreaController({
      id: `id-${nanoid()}`,
      music: `music-${nanoid()}`,
      roundId: `round-${nanoid()}`,
      duration: 0,
      keySequence: [],
      points: {},
    });
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

  describe('Dance Overlay Tests', () => {
    describe('useHandleKeys', () => {
      beforeEach(() => {
        render(RenderUseHandleKeys(danceController, townController));
      });

      afterEach(() => {
        cleanup();
      });

      /**
       * Expects that a dance move event was emitted to the townController
       * and the dance area controller
       */
      const expectDanceMove = (danceMove: DanceMoveResult) => {
        expect(danceControllerDanceMoveSpy).toHaveBeenLastCalledWith(danceMove);
        expect(townControllerDanceMoveSpy).toHaveBeenLastCalledWith(danceMove);
      };

      it('Emits successful dance move result when the right key is pressed', () => {
        const model = danceController.danceAreaModel();
        model.keySequence = ['one', 'two', 'three'];
        danceController.updateFrom(model);
        danceController.keyResults = [false];
        const key: NumberKey = 'two';
        act(() => {
          danceController.emit('numberPressed', key);
        });
        expectDanceMove({
          interactableID: danceController.id,
          playerId: ourPlayer.id,
          roundId: danceController.roundId,
          success: true,
          keyPressed: key,
        });
        expect(danceController.keyResults).toEqual([false, true]);
      });

      it('Emits unsuccessful dance move result when the wrong key is pressed', () => {
        const model = danceController.danceAreaModel();
        model.keySequence = ['one', 'two', 'three'];
        danceController.updateFrom(model);
        danceController.keyResults = [false];
        const key: NumberKey = 'four';
        act(() => {
          danceController.emit('numberPressed', key);
        });
        expectDanceMove({
          interactableID: danceController.id,
          playerId: ourPlayer.id,
          roundId: danceController.roundId,
          success: false,
          keyPressed: key,
        });
        expect(danceController.keyResults).toEqual([false, false]);
      });

      it('Does not emit a dance move result when too many keys are pressed', () => {
        const model = danceController.danceAreaModel();
        model.keySequence = ['one', 'two', 'three'];
        danceController.updateFrom(model);
        danceController.keyResults = [true, true, true];
        act(() => {
          danceController.emit('numberPressed', 'four');
        });
        expect(danceControllerDanceMoveSpy).not.toHaveBeenCalled();
        expect(townControllerDanceMoveSpy).not.toHaveBeenCalled();
        expect(danceController.keyResults).toEqual([true, true, true]);
      });
    });
  });
});
