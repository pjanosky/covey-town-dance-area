import { ChakraProvider } from '@chakra-ui/react';
import { nanoid } from 'nanoid';
import TownController from '../../../classes/TownController';
import TownControllerContext from '../../../contexts/TownControllerContext';
import { mockTownController } from '../../../TestUtils';
import React from 'react';
import DanceAreaController from '../../../classes/DanceAreaController';
import { act } from 'react-dom/test-utils';
import { DeepMockProxy } from 'jest-mock-extended';
import { RenderResult, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DanceLeaderboard, DanceMusicPlayer, useHandleKeys } from './DanceOverlay';
import { DanceArea, DanceMoveResult } from '../../../types/CoveyTownSocket';
import PlayerController from '../../../classes/PlayerController';
import useTownController from '../../../hooks/useTownController';
import { calculateKeyIndex, DanceKeyViewer } from './DanceKeyView';
import userEvent from '@testing-library/user-event';
import RatingModal from './RatingModal';
import SelectMusicModal from './SelectMusicModal';

function HandleKeysHook({ danceController }: { danceController: DanceAreaController }) {
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
        <HandleKeysHook danceController={danceController}></HandleKeysHook>
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

function RenderLeaderboard(danceController: DanceAreaController, townController: TownController) {
  return (
    <ChakraProvider>
      <TownControllerContext.Provider value={townController}>
        <DanceLeaderboard
          danceController={danceController}
          townController={townController}></DanceLeaderboard>
      </TownControllerContext.Provider>
    </ChakraProvider>
  );
}

function RenderDanceMusicPlayer(
  danceController: DanceAreaController,
  townController: TownController,
) {
  return (
    <ChakraProvider>
      <TownControllerContext.Provider value={townController}>
        <DanceMusicPlayer
          danceController={danceController}
          townController={townController}></DanceMusicPlayer>
      </TownControllerContext.Provider>
    </ChakraProvider>
  );
}

function RenderMusicModal(danceController: DanceAreaController, townController: TownController) {
  return (
    <ChakraProvider>
      <TownControllerContext.Provider value={townController}>
        <SelectMusicModal
          isOpen={true}
          close={() => {}}
          danceController={danceController}
          townController={townController}></SelectMusicModal>
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
  let otherPlayers: PlayerController[];

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
    otherPlayers = [
      new PlayerController(nanoid(), 'person0', {
        moving: false,
        rotation: 'front',
        x: 0,
        y: 0,
      }),
      new PlayerController(nanoid(), 'person1', {
        moving: false,
        rotation: 'front',
        x: 0,
        y: 0,
      }),
      new PlayerController(nanoid(), 'person2', {
        moving: false,
        rotation: 'front',
        x: 0,
        y: 0,
      }),
    ];
    townController = mockTownController({
      danceAreas: [danceController],
      ourPlayer: ourPlayer,
      players: otherPlayers,
    });
    townControllerDanceMoveSpy = jest.spyOn(townController, 'emitDanceMove');
    danceControllerDanceMoveSpy = jest.spyOn(townController, 'emitDanceMove');
  });

  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
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

  describe('Dance Leaderboard', () => {
    it('Displays the points for all the players in the area', async () => {
      const points = new Map();
      points.set(ourPlayer.id, 30);
      points.set(otherPlayers[0].id, 45);
      points.set(otherPlayers[1].id, 3);
      points.set(otherPlayers[2].id, 28);
      danceController.points = points;

      const renderData = render(RenderLeaderboard(danceController, townController));

      expect(await renderData.findByText('1. person0')).toBeVisible();
      expect(await renderData.findByText('2. You')).toBeVisible();
      expect(await renderData.findByText('3. person2')).toBeVisible();
      expect(await renderData.findByText('4. person1')).toBeVisible();
      expect(await renderData.findByText('30')).toBeVisible();
      expect(await renderData.findByText('45')).toBeVisible();
      expect(await renderData.findByText('3')).toBeVisible();
      expect(await renderData.findByText('28')).toBeVisible();
    });

    it('Opens the rating modal when player is clicked', async () => {
      const points = new Map();
      points.set(ourPlayer.id, 30);
      points.set(otherPlayers[0].id, 45);
      points.set(otherPlayers[1].id, 3);
      points.set(otherPlayers[2].id, 28);
      danceController.points = points;

      let renderData = render(RenderLeaderboard(danceController, townController));

      userEvent.click(renderData.getByText('1. person0'));
      renderData = render(RenderLeaderboard(danceController, townController));
      expect(await renderData.findByText('Enter your rating for person0 here!')).toBeVisible();
    });
  });

  describe('RatingModal', () => {
    let renderData: RenderResult;
    beforeEach(() => {
      const points = new Map();
      points.set(ourPlayer.id, 30);
      points.set(otherPlayers[0].id, 45);
      points.set(otherPlayers[1].id, 3);
      points.set(otherPlayers[2].id, 28);
      danceController.points = points;

      renderData = render(
        <ChakraProvider>
          <TownControllerContext.Provider value={townController}>
            <RatingModal
              isOpen={true}
              close={() => {}}
              danceController={danceController}
              townController={townController}
              playerId={otherPlayers[0].id}></RatingModal>
          </TownControllerContext.Provider>
        </ChakraProvider>,
      );
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('Correctly sets the number of points in the slider', async () => {
      const ratingInputElement = renderData.getByLabelText(
        'Rate the player 3 points',
      ) as HTMLInputElement;
      fireEvent.change(ratingInputElement, { target: { value: '3' } });
      expect(ratingInputElement.value).toBe('3');
    });

    it('Closes the modal when send button is submitted', async () => {
      const townRatingSpy = jest.spyOn(townController, 'emitDanceRating');
      const ratingInputElement = renderData.getByLabelText(
        'Rate the player 3 points',
      ) as HTMLInputElement;
      const send = screen.getByRole('button', { name: 'Send' });
      fireEvent.change(ratingInputElement, { target: { value: '3' } });
      fireEvent.submit(send);
      expect(send).not.toBeVisible();
      expect(townRatingSpy).toHaveBeenCalledWith({
        interactableID: danceController.id,
        sender: townController.ourPlayer.id,
        recipient: otherPlayers[0].id,
        rating: 3,
      });
    });

    it('Closes the modal when cancel button is submitted', async () => {
      const cancel = screen.getByRole('button', { name: 'Cancel' });
      fireEvent.submit(cancel);
      expect(cancel).not.toBeVisible();
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

  describe('DanceMusicPlayer', () => {
    it('Displays add to queue button when no music is set in the area', async () => {
      danceController.music = [];
      const renderData = render(RenderDanceMusicPlayer(danceController, townController));
      expect(await renderData.findByText('Add to queue!')).toBeVisible();
      expect(await renderData.findByTitle('Queue')).toBeVisible();
    });

    it('Displays the music modal when the add to queue button is pressed', async () => {
      render(RenderDanceMusicPlayer(danceController, townController));
      const button = screen.getByRole('button', { name: 'Add to queue!' });
      fireEvent.click(button);
      const selectMusicModal = screen.getByRole('dialog', {
        name: 'Enter a Spotify link to queue here!',
      });
      expect(selectMusicModal).toBeInTheDocument();
    });

    it('Displays add to queue button and player when music is set in the area', async () => {
      danceController.music = [
        {
          url: 'https://open.spotify.com/track/5Y35SjAfXjjG0sFQ3KOxmm?si=df34d9f960514271',
          duration: 18100,
          title: 'Nobody Gets Me',
          artist: 'SZA',
          album: 'SOS',
        },
      ];
      const renderData = render(RenderDanceMusicPlayer(danceController, townController));
      expect(await renderData.findByText('Add to queue!')).toBeVisible();
      expect(await renderData.findByTitle('Spotify')).toBeVisible();
    });
  });

  describe('SelectMusicModal', () => {
    it('Renders with correct title', () => {
      render(RenderMusicModal(danceController, townController));
      const title = screen.getByText('Enter a Spotify link to queue here!');
      expect(title).toBeInTheDocument();
    });

    it('Renders the input form for Spotify URLs', () => {
      render(RenderMusicModal(danceController, townController));
      const input = screen.getByLabelText('Spotify URL');
      expect(input).toBeInTheDocument();
      const addButton = screen.getByText('Add to queue');
      expect(addButton).toBeInTheDocument();
      const cancelButton = screen.getByText('Cancel');
      expect(cancelButton).toBeInTheDocument();
    });
  });
});
