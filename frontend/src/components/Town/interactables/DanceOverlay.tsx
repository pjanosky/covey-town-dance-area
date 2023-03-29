import React, { useEffect, useState } from 'react';
import TownController, {
  useDanceAreaController,
  useInteractable,
} from '../../../classes/TownController';
import useTownController from '../../../hooks/useTownController';

import { DanceArea as DanceAreaInteractable } from './DanceArea';
import { DanceMoveResult, NumberKey } from '../../../types/CoveyTownSocket';
import { Box, Button, Grid, Input, makeStyles, Typography } from '@material-ui/core';
import { calculateKeyIndex, DanceKeyViewer } from './DanceKeyView';
import DanceAreaController, { useMusic } from '../../../classes/DanceAreaController';

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
  const townController = useTownController();
  const music = useMusic(danceController);
  const [input, setInput] = useState('');

  return (
    <Box display='flex' flexDirection='column'>
      <span> Music Player Here</span>
      <Input
        onKeyDown={async event => {
          if (event.key === 'Enter') {
            await townController.queueDanceAreaTrack(danceController, input);
          }
        }}
        onChange={event => {
          setInput(event.target.value);
        }}></Input>
      <Box className={overlayComponent}>
        <div>
          {music.map((track, i) => {
            return <Typography key={`${track}-${i}`}> {track}</Typography>;
          })}
        </div>
      </Box>
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
 * Dance overlay displays all of the overlay components for a dance interactable area
 * including the keys the user needs to press, the leaderboard, and the music player.
 * It also handles key presses made by the user while in the area.
 */
export function DanceOverlay({ danceArea }: { danceArea: DanceAreaInteractable }): JSX.Element {
  const danceController = useDanceAreaController(danceArea.id);
  const townController = useTownController();
  useHandleKeys(danceController, townController);

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
              <DanceMusicPlayer danceController={danceController}></DanceMusicPlayer>
            </Grid>
            <Grid item>
              <DanceLeaderboard danceController={danceController}></DanceLeaderboard>
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
