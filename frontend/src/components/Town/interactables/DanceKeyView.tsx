import { Box, Grid, ListItem, makeStyles, Typography } from '@material-ui/core';
import {
  useActiveRound,
  useKeySequence,
  useKeysPressed,
} from '../../../classes/DanceAreaController';
import { NumberKey } from '../../../types/CoveyTownSocket';
import { DanceControllerProps, useOverlayComponentStyle } from './DanceOverlay';
import React from 'react';

const KEY_SIZE = 50;
const SPACING_FACTOR = 0.5;

/**
 * Generates the text that is shown to the user for a given NumberKey.
 */
function symbolForKey(numberKey: NumberKey): string {
  switch (numberKey) {
    case 'one':
      return '1';
    case 'two':
      return '2';
    case 'three':
      return '3';
    case 'four':
      return '4';
    default:
      return numberKey;
  }
}

/**
 * Generates the offset (from the left) that a key is positioned with. An offset
 * of 0 will place the key all the way to the left, and an offset of 3 will place
 * the key all the way to the right.
 */
function leftFlexForKey(numberKey: NumberKey): number {
  switch (numberKey) {
    case 'one':
      return 0;
    case 'two':
      return 1;
    case 'three':
      return 2;
    case 'four':
      return 3;
    default:
      return 0;
  }
}

/**
 * KeyTile displays one key that the user has to press. The color of the key
 * is based of of whether or not the user pressed the right key corresponding
 *  to this one in the sequence.
 */
function KeyTile({ numberKey, correct }: { numberKey: NumberKey; correct?: boolean }): JSX.Element {
  let color: string;
  if (correct === undefined) {
    color = 'black';
  } else if (correct) {
    color = 'green';
  } else {
    color = 'red';
  }
  const leftFlex = leftFlexForKey(numberKey);
  return (
    <ListItem style={{ padding: '0px 10px' }}>
      <Grid container>
        <Box flex={leftFlex}></Box>
        <Box flex={1} display='flex' justifyContent='center' alignItems='center'>
          <Box
            border='solid'
            borderColor={color}
            borderRadius={5}
            width={KEY_SIZE}
            height={KEY_SIZE}
            marginTop={`${KEY_SIZE * SPACING_FACTOR}px`}
            display='flex'
            justifyContent='center'
            alignItems='center'>
            <Typography style={{ color: color }}>{symbolForKey(numberKey)}</Typography>
          </Box>
        </Box>
        <Box flex={3 - leftFlex}></Box>
      </Grid>
    </ListItem>
  );
}

/**
 * KeyScrollContent displays all of the keys that that the user needs to
 * press. It is separate from {@link KeyScrollView} so that the animation does
 * not restart on re-renders caused by changes to {@link useKeysPressed} and
 * {@link useKeySequence}.
 *
 */
function KeyScrollContent({ danceController }: DanceControllerProps) {
  const keysPressed = useKeysPressed(danceController);
  const keySequence = useKeySequence(danceController);

  return (
    <div>
      {keySequence
        .map((key, i) => {
          let correct: boolean | undefined = undefined;
          if (i < keysPressed.length) {
            correct = i < keysPressed.length && keysPressed[i] === key;
          }
          return <KeyTile key={`key-tile-${i}`} numberKey={key} correct={correct}></KeyTile>;
        })
        .reverse()}
    </div>
  );
}

/**
 * KeyScrollView displays a scrolling list of all of the key the user has to press.
 */
function KeyScrollView({ danceController }: DanceControllerProps) {
  const classes = makeStyles({
    'scrollingDiv': {
      animation: '$move 10s infinite linear',
    },
    '@keyframes move': {
      from: {
        transform: 'translateY(-100%)',
      },
      to: {
        transform: 'translateY(100%)',
      },
    },
  })();

  return (
    <Box>
      <Box width='100%' position='absolute' bottom='50px' borderBottom='3px dashed black'></Box>
      <div className={classes.scrollingDiv}>
        <KeyScrollContent danceController={danceController}></KeyScrollContent>
      </div>
    </Box>
  );
}

/**
 * NoActiveRound displays a message if there is currently no active round set.
 */
function NoActiveRound() {
  return (
    <Box display='flex' justifyContent='center' alignItems='center' height='100px'>
      <div> No active round</div>
    </Box>
  );
}

/**
 * DanceKeyViewer displays the keystrokes the user has to press for the current round.
 * It animates a bar that crosses the keys to show the user when to press each key.
 */
export function DanceKeyViewer({ danceController }: DanceControllerProps) {
  const activeRound = useActiveRound(danceController);

  const overlayComponent = useOverlayComponentStyle(0);

  return (
    <div
      className={overlayComponent}
      style={{ maxHeight: '400px', minHeight: '100px', overflow: 'hidden', position: 'relative' }}>
      {activeRound ? (
        <KeyScrollView danceController={danceController}></KeyScrollView>
      ) : (
        <NoActiveRound></NoActiveRound>
      )}
    </div>
  );
}
