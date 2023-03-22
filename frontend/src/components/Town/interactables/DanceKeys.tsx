import React, { useEffect } from 'react';

import { useDanceAreaController, useInteractable } from '../../../classes/TownController';
import useTownController from '../../../hooks/useTownController';

import DanceAreaInteractable from './DanceArea';
import { DanceMoveResult, NumberKey } from '../../../types/CoveyTownSocket';
import DanceAreaController, {
  useKeyPressed,
  useKeySequence,
} from '../../../classes/DanceAreaController';
import { Box, Grid, makeStyles, Typography } from '@material-ui/core';

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
  return (
    <Box width={200} bgcolor='white'>
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
  return (
    <Box width={200} bgcolor='white'>
      <Typography> Leaderboard (this is some mock data)</Typography>
      <Typography> 1. Slaytie</Typography>
      <Typography> 2. Slayleen</Typography>
      <Typography> 3. Slayter</Typography>
      <Typography> 4. Slayssie</Typography>
      <Typography> 5. Slaymud</Typography>
    </Box>
  );
}

/**
 *  The DanceArea monitors player's interactions in a DanceArea on the map. Specifically,
 * handling the key press logic.
 *
 * @param props the dance aera interactable that is being interacted with
 */
export function DanceAreaOverlay({ danceArea }: { danceArea: DanceAreaInteractable }): JSX.Element {
  const townController = useTownController();
  const danceAreaController = useDanceAreaController(danceArea.name);

  useEffect(() => {
    const newKey = (key: NumberKey) => {
      const keySequence = danceAreaController.keySequence;
      const nextKeyIndex = danceAreaController.keysPressed.length;
      const danceMoveResult: DanceMoveResult = {
        interactableID: danceAreaController.id,
        playerId: townController.ourPlayer.id,
        roundId: danceAreaController.roundId,
        success: nextKeyIndex < keySequence.length && key == keySequence[nextKeyIndex],
      };
      danceAreaController.emit('danceMove', danceMoveResult);
      townController.emitDanceMove(danceMoveResult);
      danceAreaController.keysPressed.push(key);
    };

    danceAreaController.addListener('numberPressed', newKey);
    return () => {
      danceAreaController.removeListener('numberPressed', newKey);
    };
  }, [danceAreaController, townController]);

  return (
    <Grid
      container
      justifyContent='space-between'
      alignItems='flex-end'
      alignContent='flex-end'
      style={{ minHeight: '100%' }}>
      <Grid item>
        <DanceKeyViewer danceController={danceAreaController}></DanceKeyViewer>
      </Grid>
      <Grid item>
        <DanceLeaderboard danceController={danceAreaController}></DanceLeaderboard>
      </Grid>
    </Grid>
  );
}

/**
 * The DanceKeysWrapper is suitable to be always rendered inside of a town, and
 * will activate only if the player begins interacting with a dance area.
 */
export default function DanceOverlayWrapper(): JSX.Element {
  const danceArea = useInteractable<DanceAreaInteractable>('danceArea');
  if (danceArea) {
    return (
      <Box position='absolute' top={0} bottom={0} left={0} right={0}>
        <DanceAreaOverlay danceArea={danceArea} />
      </Box>
    );
  }
  return <></>;
}
