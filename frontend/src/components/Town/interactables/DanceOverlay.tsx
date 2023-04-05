import React, { useEffect, useState } from 'react';
import TownController, {
  useDanceAreaController,
  useInteractable,
} from '../../../classes/TownController';
import useTownController from '../../../hooks/useTownController';

import { DanceArea as DanceAreaInteractable } from './DanceArea';
import { DanceMoveResult, NumberKey } from '../../../types/CoveyTownSocket';
import { Box, Divider, Grid, makeStyles, Button, Typography } from '@material-ui/core';
import { calculateKeyIndex, DanceKeyViewer } from './DanceKeyView';
import SelectMusicModal from './SelectMusicModal';
import { Spotify } from 'react-spotify-embed';
import DanceAreaController, {
  useCurrentTrack,
  usePoints,
} from '../../../classes/DanceAreaController';

export type DanceControllerProps = { danceController: DanceAreaController };

/**
 * useBoxClass is a hook that generates the styling for a overlay component.
 */
export function useOverlayComponentStyle(padding = 25) {
  const useStyles = makeStyles({
    overlayComponent: {
      margin: '0px 25px 25px 25px',
      padding: `${padding}px`,
      borderRadius: '15px',
      backgroundColor: 'white',
      width: '275px',
    },
  });

  return useStyles().overlayComponent;
}

function nameForPlayer(townController: TownController, playerId: string | undefined): string {
  if (playerId === townController.ourPlayer.id) {
    return 'You';
  }
  return townController.players.find(player => player.id === playerId)?.userName ?? 'Player';
}

function RatingModal(): JSX.Element {
  return <></>;
}

function LeaderboardContent({
  danceController,
  townController,
  onRate,
}: {
  danceController: DanceAreaController;
  townController: TownController;
  onRate: (playerId: string) => void;
}): JSX.Element {
  const points = usePoints(danceController);
  const sortedPoints = [...points];
  sortedPoints.sort((a, b) => a[1] - b[1]);

  return (
    <Box>
      {sortedPoints.map(([playerId, score], i) => {
        return (
          <Button
            fullWidth={true}
            key={playerId}
            onClick={() => {
              onRate(playerId);
            }}
            style={{ padding: 0 }}>
            <Box display='flex' justifyContent='space-between' width='100%'>
              <span>
                {i + 1}. {nameForPlayer(townController, playerId)}
              </span>
              <span>{score}</span>
            </Box>
          </Button>
        );
      })}
    </Box>
  );
}

export function DanceLeaderboard({
  danceController,
  townController,
}: {
  danceController: DanceAreaController;
  townController: TownController;
}): JSX.Element {
  const overlayComponent = useOverlayComponentStyle(0);

  return (
    <Box className={overlayComponent} marginTop={0}>
      <RatingModal></RatingModal>
      <Typography style={{ padding: '15px 25px' }}>Leaderboard</Typography>
      <Divider></Divider>
      <Box overflow='auto' padding='25px' maxHeight='150px'>
        <LeaderboardContent
          danceController={danceController}
          townController={townController}
          onRate={() => {}}></LeaderboardContent>
      </Box>
    </Box>
  );
}

function DanceMusicPlayer({
  danceController,
  townController,
}: {
  danceController: DanceAreaController;
  townController: TownController;
}): JSX.Element {
  const overlayComponent = useOverlayComponentStyle();
  const currentTrack = useCurrentTrack(danceController);
  const [selectIsOpen, setSelectIsOpen] = useState(danceController.music === undefined);

  if (!currentTrack) {
    return (
      <Box className={overlayComponent}>
        <Button
          onClick={() => {
            setSelectIsOpen(true);
          }}>
          Add to queue!
        </Button>
        <SelectMusicModal
          isOpen={selectIsOpen}
          close={() => {
            setSelectIsOpen(false);
          }}
          danceController={danceController}
          townController={townController}
        />
      </Box>
    );
  } else {
    return (
      <Box className={overlayComponent}>
        <Spotify link={currentTrack.url}> </Spotify>
        <Button
          onClick={() => {
            setSelectIsOpen(true);
          }}>
          Add to queue!
        </Button>
        <SelectMusicModal
          isOpen={selectIsOpen}
          close={() => {
            setSelectIsOpen(false);
          }}
          danceController={danceController}
          townController={townController}
        />
      </Box>
    );
  }
}

/**
 * DanceKeyHandler is a hook that responds to keys pressed by the player while in a
 * dance interactable area. It checks to see if the right key was pressed based on
 * the key sequence of the current round, and emits a DanceMoveResult to the dance
 * area controller and covey town socket.
 */
export function useHandleKeys(
  danceController: DanceAreaController,
  townController: TownController,
) {
  useEffect(() => {
    const newKey = (key: NumberKey) => {
      const keySequence = danceController.keySequence;
      const keyResults = danceController.keyResults;
      const i = calculateKeyIndex(danceController);
      if (
        i !== undefined &&
        i < keyResults.length &&
        i < keySequence.length &&
        keyResults[i] === undefined
      ) {
        const success = danceController.keySequence[i] === key;
        const danceMoveResult: DanceMoveResult = {
          interactableID: danceController.id,
          playerId: townController.ourPlayer.id,
          roundId: danceController.roundId,
          success: success,
          keyPressed: key,
        };

        danceController.emit('danceMove', danceMoveResult);
        townController.emitDanceMove(danceMoveResult);
        keyResults[i] = success;
        danceController.keyResults = keyResults;
      }
    };

    danceController.addListener('numberPressed', newKey);
    return () => {
      danceController.removeListener('numberPressed', newKey);
    };
  }, [danceController, townController]);
}

/**
 * This hook adds a listener to the dance controller for when a dance move result is emitted to eventually be passed onto the town.
 * @param danceAreaController the controller that listens for the event
 * @param danceArea the dance are from which the event is passed onto the town
 */
export function useDanceAnimation(
  danceAreaController: DanceAreaController,
  danceArea: DanceAreaInteractable,
) {
  {
    useEffect(() => {
      const danceMove = (danceMoveResult: DanceMoveResult) => {
        danceArea.doDanceMove(danceMoveResult);
      };
      danceAreaController.addListener('danceMove', danceMove);
      return () => {
        danceAreaController.removeListener('danceMove', danceMove);
      };
    }, [danceArea, danceAreaController]);
  }
}

/**
 * Dance overlay displays all of the overlay components for a dance interactable area
 * including the keys the user needs to press, the leaderboard, and the music player.
 * It also handles key presses made by the user while in the area.
 */
export function DanceOverlay({ danceArea }: { danceArea: DanceAreaInteractable }): JSX.Element {
  const danceController = useDanceAreaController(danceArea.id);
  const townController = useTownController();
  useHandleKeys(danceController, townController);
  useDanceAnimation(danceController, danceArea);

  return (
    <Box
      width='100%'
      height='100%'
      position='relative'
      display='flex'
      alignItems='flex-end'
      alignContent='flex-end'>
      <Box position='sticky' bottom='0px' left='0px' right='0px' width='100%'>
        <Grid
          container
          direction='row'
          justifyContent='space-between'
          alignItems='flex-end'
          alignContent='flex-end'
          wrap='nowrap'>
          <Grid item>
            <DanceKeyViewer danceController={danceController}></DanceKeyViewer>
          </Grid>
          <Grid container item direction='column' alignItems='flex-end' alignContent='flex-end'>
            <Grid item>
              <DanceMusicPlayer
                danceController={danceController}
                townController={townController}></DanceMusicPlayer>
            </Grid>
            <Grid item>
              <DanceLeaderboard
                danceController={danceController}
                townController={townController}></DanceLeaderboard>
            </Grid>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

/**
 * The DanceKeysWrapper is suitable to be always rendered inside of a town. It displays
 * the overlays for the dance interactable area when the player is interacting with a
 * dance area.
 */
export default function DanceOverlayWrapper(): JSX.Element {
  const danceArea = useInteractable<DanceAreaInteractable>('danceArea');
  if (danceArea) {
    return (
      <Box position='absolute' top={0} bottom={0} left={0} right={0}>
        <DanceOverlay danceArea={danceArea} />
      </Box>
    );
  }
  return <></>;
}
