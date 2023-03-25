import React, { useEffect } from 'react';
import TownController, {
  useDanceAreaController,
  useInteractable,
} from '../../../classes/TownController';
import useTownController from '../../../hooks/useTownController';

import { DanceArea as DanceAreaInteractable } from './DanceArea';
import { DanceMoveResult, NumberKey } from '../../../types/CoveyTownSocket';
import { Box, Grid, makeStyles, Typography } from '@material-ui/core';
import { DanceKeyViewer } from './DanceKeyView';
import DanceAreaController from '../../../classes/DanceAreaController';

export type DanceControllerProps = { danceController: DanceAreaController };

/**
 * useBoxClass is a hook that generates the styling for a overlay component.
 */
export function useOverlayComponentStyle(padding = 25) {
  const useStyles = makeStyles({
    overlayComponent: {
      margin: '25px',
      padding: `${padding}px`,
      borderRadius: '15px',
      backgroundColor: 'white',
      width: '300px',
    },
  });

  return useStyles().overlayComponent;
}

export function DanceLeaderboard({ danceController }: DanceControllerProps): JSX.Element {
  const overlayComponent = useOverlayComponentStyle();
  return (
    <Box className={overlayComponent}>
      <Typography> Leaderboard (this is some mock data)</Typography>
      <Typography> 1. Slaytie</Typography>
      <Typography> 2. Slayleen</Typography>
      <Typography> 3. Slayter</Typography>
      <Typography> 4. Slayssie</Typography>
      <Typography> 5. Slaymud</Typography>
    </Box>
  );
}

function DanceMusicPlayer({ danceController }: DanceControllerProps): JSX.Element {
  const overlayComponent = useOverlayComponentStyle();
  return (
    <Box className={overlayComponent}>
      <Typography> This is where the music player will be</Typography>
    </Box>
  );
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
      const nextKeyIndex = danceController.keysPressed.length;
      const danceMoveResult: DanceMoveResult = {
        interactableID: danceController.id,
        playerId: townController.ourPlayer.id,
        roundId: danceController.roundId,
        success: nextKeyIndex < keySequence.length && key === keySequence[nextKeyIndex],
      };
      danceController.emit('danceMove', danceMoveResult);
      townController.emitDanceMove(danceMoveResult);
      danceController.keysPressed = [...danceController.keysPressed, key];
    };

    danceController.addListener('numberPressed', newKey);
    return () => {
      danceController.removeListener('numberPressed', newKey);
    };
  }, [danceController, townController]);
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

  return (
    <Grid
      container
      direction='row'
      justifyContent='space-between'
      alignItems='flex-end'
      alignContent='flex-end'
      wrap='nowrap'
      style={{ minHeight: '100%', minWidth: '100%' }}>
      <Grid item>
        <DanceKeyViewer danceController={danceController}></DanceKeyViewer>
      </Grid>
      <Grid container item direction='column' alignItems='flex-end' alignContent='flex-end'>
        <Grid item>
          <DanceMusicPlayer danceController={danceController}></DanceMusicPlayer>
        </Grid>
        <Grid item>
          <DanceLeaderboard danceController={danceController}></DanceLeaderboard>
        </Grid>
      </Grid>
    </Grid>
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
