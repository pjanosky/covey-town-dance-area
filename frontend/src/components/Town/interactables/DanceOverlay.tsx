import React, { useEffect } from 'react';

import { useDanceAreaController, useInteractable } from '../../../classes/TownController';
import useTownController from '../../../hooks/useTownController';

import { DanceArea as DanceAreaInteractable } from './DanceArea';
import { DanceMoveResult, NumberKey } from '../../../types/CoveyTownSocket';
import DanceAreaController from '../../../classes/DanceAreaController';
import { Box, Grid, makeStyles, Typography } from '@material-ui/core';

/**
 * useBoxClass is a hook that generates the styling for a overlay component.
 */
function useOverlayComponentStyle() {
  const padding = '25px';
  const useStyles = makeStyles({
    overlayComponent: {
      margin: `${padding} ${padding} ${padding} ${padding}`,
      padding: `${padding} ${padding} ${padding} ${padding}`,
      borderRadius: '15px',
      backgroundColor: 'white',
      width: 250,
    },
  });

  return useStyles().overlayComponent;
}

/**
 * DanceKeyViewer displays the keystrokes the user has to press for the current round.
 * It animates a bar that crosses the keys to show the user when to press each key.
 */
function DanceKeyViewer({
  danceController,
}: {
  danceController: DanceAreaController;
}): JSX.Element {
  const useStyles = makeStyles({
    keyBox: {
      width: 75,
      height: 75,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    },
  });
  const classes = useStyles();
  const overlayComponent = useOverlayComponentStyle();
  return (
    <Box className={overlayComponent}>
      <Typography> Key viewer here</Typography>
      <Box className={classes.keyBox} bgcolor='purple'>
        <Typography> 1</Typography>
      </Box>
      <Box height={25}></Box>
      <Box className={classes.keyBox} bgcolor='purple'>
        <Typography> 2</Typography>
      </Box>
      <Box height={25}></Box>
      <Box className={classes.keyBox} bgcolor='purple'>
        <Typography> 3</Typography>
      </Box>
      <Box height={25}></Box>
      <Box className={classes.keyBox} bgcolor='purple'>
        <Typography> 4</Typography>
      </Box>
    </Box>
  );
}

function DanceLeaderboard({
  danceController,
}: {
  danceController: DanceAreaController;
}): JSX.Element {
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

function DanceMusicPlayer({
  danceController,
}: {
  danceController: DanceAreaController;
}): JSX.Element {
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
export function useHandleKeys(danceController: DanceAreaController) {
  const townController = useTownController();

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
      danceController.keysPressed.push(key);
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
  useHandleKeys(danceController);

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
