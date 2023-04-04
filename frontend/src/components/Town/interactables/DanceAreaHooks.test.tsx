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
  useActiveRound,
  useCurrentTrack,
} from '../../../classes/DanceAreaController';
import { act } from 'react-dom/test-utils';
import { DeepMockProxy } from 'jest-mock-extended';
import { cleanup, render, RenderResult, waitFor } from '@testing-library/react';
import { KeySequence } from '../../../types/CoveyTownSocket';

function HookComponents({ danceController }: { danceController: DanceAreaController }) {
  const music = useMusic(danceController);
  const keySequence = useKeySequence(danceController);
  const keyResults = useKeyResults(danceController);
  const activeRound = useActiveRound(danceController);

  return (
    <div>
      <span> {`music-${music}`}</span>
      <span> {`keySequence-${keySequence}`} </span>
      <span> {`keyResults-${keyResults}`} </span>
      <span> {`activeRound-${activeRound}`} </span>
    </div>
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

function CurrentTrackHookComponents({ danceController }: { danceController: DanceAreaController }) {
  const currentTrack = useCurrentTrack(danceController);
  return (
    <div>
      <span> {`currentTrack-${currentTrack}`}</span>
    </div>
  );
}

function RenderCurrentTrackHooks(
  danceController: DanceAreaController,
  townController: TownController,
): JSX.Element {
  return (
    <ChakraProvider>
      <TownControllerContext.Provider value={townController}>
        <CurrentTrackHookComponents danceController={danceController}></CurrentTrackHookComponents>
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
      id: nanoid(),
      music: [],
      roundId: nanoid(),
      duration: 0,
      keySequence: [],
      points: {},
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

  describe('useMusic', () => {
    it('useMusic Registers exactly one musicChanged listener', () => {
      act(() => {
        danceController.emit('musicChanged', []);
      });
      act(() => {
        danceController.emit('musicChanged', ['All Too Well (TV) (10 minute version)']);
      });
      getSingleListenerAdded('musicChanged');
    });
    it('useMusic unregisters exactly the same musicChanged listener on unmounting', () => {
      act(() => {
        danceController.emit('musicChanged', ['some song here']);
      });
      const listenerAdded = getSingleListenerAdded('musicChanged');
      cleanup();
      expect(getSingleListenerRemoved('musicChanged')).toBe(listenerAdded);
    });
    it('useMusic refreshes the view when the music changes', async () => {
      const newMusic = ['twinkle twinkle little star'];
      act(() => {
        danceController.emit('musicChanged', newMusic);
      });
      expect(await renderData.findByText(`music-${newMusic}`)).toBeVisible();
    });
  });

  describe('useKeySequence', () => {
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
    it('useKeySequence refreshes the view when the key sequence changes', async () => {
      const newKeySequence: KeySequence = ['one', 'two', 'three'];
      act(() => {
        danceController.emit('keySequenceChanged', newKeySequence);
      });
      expect(await renderData.findByText(`keySequence-${newKeySequence}`)).toBeVisible();
    });
  });

  describe('useKeyResults', () => {
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
    it('useKeyResults refreshes the view when the key sequence changes', async () => {
      const newKeyResults = [undefined, true, false];
      act(() => {
        danceController.emit('keyResultsChanged', newKeyResults);
      });
      expect(await renderData.findByText(`keyResults-${newKeyResults}`)).toBeVisible();
    });
  });

  describe('useDanceAreaController', () => {
    it('Removes the listeners and adds new ones if the controller changes', () => {
      const origMusicChange = getSingleListenerAdded('musicChanged');
      const origKeySequenceChange = getSingleListenerAdded('keySequenceChanged');
      const origKeyResultsChange = getSingleListenerAdded('keyResultsChanged');

      const newDanceAreaController = new DanceAreaController({
        id: `id-${nanoid()}`,
        music: [],
        roundId: `round-${nanoid()}`,
        duration: 0,
        keySequence: [],
        points: {},
      });
      const newAddListenerSpy = jest.spyOn(newDanceAreaController, 'addListener');
      renderData.rerender(RenderDanceAreaHooks(newDanceAreaController, townController));

      expect(getSingleListenerRemoved('musicChanged')).toBe(origMusicChange);
      expect(getSingleListenerRemoved('keySequenceChanged')).toBe(origKeySequenceChange);
      expect(getSingleListenerRemoved('keyResultsChanged')).toBe(origKeyResultsChange);

      getSingleListenerAdded('musicChanged', newAddListenerSpy);
      getSingleListenerAdded('keySequenceChanged', newAddListenerSpy);
      getSingleListenerAdded('keyResultsChanged', newAddListenerSpy);
    });
  });

  describe('useActiveRound', () => {
    it('useActiveRound registers exactly one keysResults listener', () => {
      act(() => {
        danceController.emit('roundIdChanged', nanoid());
      });
      act(() => {
        danceController.emit('roundIdChanged', nanoid());
      });
      act(() => {
        danceController.emit('roundIdChanged', nanoid());
      });
      getSingleListenerAdded('roundIdChanged');
    });
    it('useActiveRound unregisters exactly the same keysResults listener on unmounting', () => {
      act(() => {
        danceController.emit('roundIdChanged', nanoid());
      });
      const listenerAdded = getSingleListenerAdded('roundIdChanged');
      cleanup();
      expect(getSingleListenerRemoved('roundIdChanged')).toBe(listenerAdded);
    });
    it('useActiveRound refreshes the view when a new round starts', async () => {
      const newRoundID = nanoid();
      act(() => {
        danceController.roundStart = new Date();
        danceController.duration = 5;
        danceController.emit('roundIdChanged', newRoundID);
      });
      expect(await renderData.findByText(`activeRound-${newRoundID}`)).toBeVisible();
    });
    it('useActiveRound refreshes the view when the round duration ends', async () => {
      const newRoundID = nanoid();
      act(() => {
        danceController.roundStart = new Date();
        danceController.duration = 1;
        danceController.emit('roundIdChanged', newRoundID);
      });

      const waitDuration = danceController.duration * 1000 + 1000;
      await waitFor(() => new Promise(resolve => setTimeout(resolve, waitDuration)), {
        timeout: waitDuration + 1000,
      });
      expect(await renderData.findByText(`activeRound-${undefined}`)).toBeVisible();
    });
  });

  describe('useCurrentTrack', () => {
    beforeEach(() => {
      danceController = new DanceAreaController({
        id: nanoid(),
        music: [],
        roundId: nanoid(),
        duration: 0,
        keySequence: [],
        points: {},
      });
      townController = mockTownController({ danceAreas: [danceController] });

      addListenerSpy = jest.spyOn(danceController, 'addListener');
      removeListenerSpy = jest.spyOn(danceController, 'removeListener');

      renderData = render(RenderCurrentTrackHooks(danceController, townController));
    });

    it('useCurrentTrack registers exactly one currentTrackChanged listener', () => {
      act(() => {
        danceController.emit('currentTrackChanged', undefined);
      });
      act(() => {
        danceController.emit('currentTrackChanged', 'song1');
      });
      act(() => {
        danceController.emit('currentTrackChanged', 'song2');
      });
      getSingleListenerAdded('currentTrackChanged');
    });
    it('useCurrentTrack unregisters exactly the same currentTrackChanged listener on unmounting', () => {
      act(() => {
        danceController.emit('currentTrackChanged', 'song1');
      });
      const listenerAdded = getSingleListenerAdded('currentTrackChanged');
      cleanup();
      expect(getSingleListenerRemoved('currentTrackChanged')).toBe(listenerAdded);
    });
    it('useCurrentTrack refreshes the view when the first track in the queue changes', async () => {
      const newMusic = ['song1', 'song2', 'song3'];
      act(() => {
        danceController.music = ['song1', 'song2', 'song3'];
      });
      expect(await renderData.findByText(`currentTrack-${newMusic[0]}`)).toBeVisible();

      act(() => {
        danceController.music = [];
      });
      expect(await renderData.findByText(`currentTrack-${undefined}`)).toBeVisible();
    });
  });
});
