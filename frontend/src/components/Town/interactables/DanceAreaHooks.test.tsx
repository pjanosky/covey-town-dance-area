import { ChakraProvider } from '@chakra-ui/react';
import { nanoid } from 'nanoid';
import TownController from '../../../classes/TownController';
import TownControllerContext from '../../../contexts/TownControllerContext';
import { EventNames, mockTownController } from '../../../TestUtils';
import React from 'react';
import DanceAreaController, {
  DanceAreaEvents,
  useKeySequence,
  useKeyResults,
  useMusic,
} from '../../../classes/DanceAreaController';
import { act } from 'react-dom/test-utils';
import { DeepMockProxy } from 'jest-mock-extended';
import { cleanup, render, RenderResult } from '@testing-library/react';

function HookComponents({ danceController }: { danceController: DanceAreaController }) {
  const music = useMusic(danceController);
  const keySequence = useKeySequence(danceController);
  const keysPressed = useKeyResults(danceController);
  return (
    <>
      {music}
      {keySequence}
      {keysPressed}
    </>
  );
}

function RenderDanceAreaHooks(
  danceController: DanceAreaController,
  townController: TownController,
): JSX.Element {
  return (
    <ChakraProvider>
      <TownControllerContext.Provider value={townController}>
        <HookComponents danceController={danceController}></HookComponents>
      </TownControllerContext.Provider>
    </ChakraProvider>
  );
}

describe('DanceAreaController Hooks', () => {
  let danceController: DanceAreaController;
  type DanceControllerEventName = keyof DanceAreaEvents;
  let addListenerSpy: jest.SpyInstance<
    DanceAreaController,
    [event: DanceControllerEventName, listener: DanceAreaEvents[DanceControllerEventName]]
  >;

  let removeListenerSpy: jest.SpyInstance<
    DanceAreaController,
    [event: DanceControllerEventName, listener: DanceAreaEvents[DanceControllerEventName]]
  >;

  let townController: DeepMockProxy<TownController>;

  let renderData: RenderResult;
  beforeEach(() => {
    danceController = new DanceAreaController({
      id: `id-${nanoid()}`,
      music: `music-${nanoid()}`,
      roundId: `round-${nanoid()}`,
      duration: 0,
      keySequence: [],
      points: new Map(),
    });
    townController = mockTownController({ danceAreas: [danceController] });

    addListenerSpy = jest.spyOn(danceController, 'addListener');
    removeListenerSpy = jest.spyOn(danceController, 'removeListener');

    renderData = render(RenderDanceAreaHooks(danceController, townController));
  });

  /**
   * Retrieve the listener passed to "addListener" for a given eventName
   * @throws Error if the addListener method was not invoked exactly once for the given eventName
   */
  function getSingleListenerAdded<Ev extends EventNames<DanceAreaEvents>>(
    eventName: Ev,
    spy = addListenerSpy,
  ): DanceAreaEvents[Ev] {
    const addedListeners = spy.mock.calls.filter(eachCall => eachCall[0] === eventName);
    if (addedListeners.length !== 1) {
      throw new Error(
        `Expected to find exactly one addListener call for ${eventName} but found ${addedListeners.length}`,
      );
    }
    return addedListeners[0][1] as unknown as DanceAreaEvents[Ev];
  }
  /**
   * Retrieve the listener passed to "removeListener" for a given eventName
   * @throws Error if the removeListener method was not invoked exactly once for the given eventName
   */
  function getSingleListenerRemoved<Ev extends EventNames<DanceAreaEvents>>(
    eventName: Ev,
  ): DanceAreaEvents[Ev] {
    const removedListeners = removeListenerSpy.mock.calls.filter(
      eachCall => eachCall[0] === eventName,
    );
    if (removedListeners.length !== 1) {
      throw new Error(
        `Expected to find exactly one removeListeners call for ${eventName} but found ${removedListeners.length}`,
      );
    }
    return removedListeners[0][1] as unknown as DanceAreaEvents[Ev];
  }

  describe('Dance area controller hooks', () => {
    it('useMusic Registers exactly one musicChanged listener', () => {
      act(() => {
        danceController.emit('musicChanged', undefined);
      });
      act(() => {
        danceController.emit('musicChanged', 'All Too Well (TV) (10 minute version)');
      });
      getSingleListenerAdded('musicChanged');
    });
    it('useMusic unregisters exactly the same musicChanged listener on unmounting', () => {
      act(() => {
        danceController.emit('musicChanged', 'some song here');
      });
      const listenerAdded = getSingleListenerAdded('musicChanged');
      cleanup();
      expect(getSingleListenerRemoved('musicChanged')).toBe(listenerAdded);
    });

    it('useKeySequence registers exactly one newKeySequence listener', () => {
      act(() => {
        danceController.emit('keySequenceChanged', ['one']);
      });
      act(() => {
        danceController.emit('keySequenceChanged', ['one', 'two']);
      });
      act(() => {
        danceController.emit('keySequenceChanged', ['four', 'three']);
      });
      getSingleListenerAdded('keySequenceChanged');
    });
    it('useKeySequence unregisters exactly the same newKeySequence listener on unmounting', () => {
      act(() => {
        danceController.emit('keySequenceChanged', ['two', 'four', 'one', 'one']);
      });
      const listenerAdded = getSingleListenerAdded('keySequenceChanged');
      cleanup();
      expect(getSingleListenerRemoved('keySequenceChanged')).toBe(listenerAdded);
    });

    it('useKeyResults registers exactly one keysResults listener', () => {
      act(() => {
        danceController.emit('keyResultsChanged', [false]);
      });
      act(() => {
        danceController.emit('keyResultsChanged', [false, false]);
      });
      act(() => {
        danceController.emit('keyResultsChanged', [false, false, true]);
      });
      getSingleListenerAdded('keyResultsChanged');
    });
    it('useKeyResults unregisters exactly the same keysResults listener on unmounting', () => {
      act(() => {
        danceController.emit('keyResultsChanged', [false, true, false, false, true]);
      });
      const listenerAdded = getSingleListenerAdded('keyResultsChanged');
      cleanup();
      expect(getSingleListenerRemoved('keyResultsChanged')).toBe(listenerAdded);
    });

    it('Removes the listeners and adds new ones if the controller changes', () => {
      const origStarChange = getSingleListenerAdded('musicChanged');
      const origTitleChange = getSingleListenerAdded('keySequenceChanged');
      const origImageContentsChange = getSingleListenerAdded('keyResultsChanged');

      const newDanceAreaController = new DanceAreaController({
        id: `id-${nanoid()}`,
        music: `music-${nanoid()}`,
        roundId: `round-${nanoid()}`,
        duration: 0,
        keySequence: [],
        points: new Map(),
      });
      const newAddListenerSpy = jest.spyOn(newDanceAreaController, 'addListener');
      renderData.rerender(RenderDanceAreaHooks(newDanceAreaController, townController));

      expect(getSingleListenerRemoved('musicChanged')).toBe(origStarChange);
      expect(getSingleListenerRemoved('keySequenceChanged')).toBe(origTitleChange);
      expect(getSingleListenerRemoved('keyResultsChanged')).toBe(origImageContentsChange);

      getSingleListenerAdded('musicChanged', newAddListenerSpy);
      getSingleListenerAdded('keySequenceChanged', newAddListenerSpy);
      getSingleListenerAdded('keyResultsChanged', newAddListenerSpy);
    });
  });
});
