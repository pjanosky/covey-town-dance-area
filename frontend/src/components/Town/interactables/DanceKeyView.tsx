import { Box, Divider, Grid, ListItem, makeStyles, Typography } from '@material-ui/core';
import DanceAreaController, {
  useActiveRound,
  useKeySequence,
  useKeyResults,
} from '../../../classes/DanceAreaController';
import { NumberKey } from '../../../types/CoveyTownSocket';
import { DanceControllerProps, useOverlayComponentStyle } from './DanceOverlay';
import React, { useEffect } from 'react';

const VIEWER_HEIGHT = 450;
const LINE_POS = 100;
const KEY_SIZE = 50;
const KEY_SPACING = 25;

/**
 * Calculates the time range where the key will be over the line.
 *
 * @returns time since the start of the round that the user
 * must press the key in milliseconds.
 */
export function calculateKeyTime(
  controller: DanceAreaController,
  index: number,
): [start: number, end: number] {
  // the number of keys in the current sequence
  const numKeys = controller.keySequence.length;
  // distance to the bottom of the key from the bottom of the scroll content
  const keyContentDist = (KEY_SIZE + KEY_SPACING) * index;
  // distance to the dotted line from the top of the viewer
  const viewerLineDist = VIEWER_HEIGHT - LINE_POS;
  // distance key key must travel before it meets the line
  const keyTravelDist = viewerLineDist + keyContentDist;

  // height of the scroll content
  const contentHeight = (KEY_SIZE + KEY_SPACING) * numKeys;
  // distance the scroll content traves over the whole course of the animation
  const animationDist = contentHeight + VIEWER_HEIGHT;
  const animationTime = controller.duration * 1000;
  const rate = animationDist / animationTime;

  const start = keyTravelDist / rate;
  const end = (keyTravelDist + KEY_SIZE) / rate;
  const buffer = 100;

  console.log(
    `i: ${index}, keyContentDist: ${keyContentDist}, keyTravelDist: ${keyTravelDist}, rate: ${rate}`,
  );
  return [start - buffer, end + buffer];
}

/**
 * Calculates the time range where the key will be over the line.
 *
 * @returns time since the start of the round that the user
 * must press the key in milliseconds.
 */
export function calculateKeyIndex(
  controller: DanceAreaController,
  time: number,
): integer | undefined {
  // the number of keys in the current sequence
  const numKeys = controller.keySequence.length;

  // height of the scroll content
  const contentHeight = (KEY_SIZE + KEY_SPACING) * numKeys;
  // distance the scroll content traves over the whole course of the animation
  const animationDist = contentHeight + VIEWER_HEIGHT;
  const animationTime = controller.duration * 1000;
  const rate = animationDist / animationTime;

  // distance to the dotted line from the top of the viewer
  const viewerLineDist = VIEWER_HEIGHT - LINE_POS;
  // the distance the scroll content has traveled since the start of the animation
  const contentDist = rate * time;
  // distance from the bottom of the scroll content that the line is currently over
  const keyDist = contentDist - viewerLineDist;
  // the index of the key that is currently over the line
  const index = Math.floor(keyDist / (KEY_SIZE + KEY_SPACING));
  // whether a key is currently over the line
  const keyOverLine = keyDist % (KEY_SIZE + KEY_SPACING) < KEY_SIZE;
  if (index >= 0 && index < controller.keySequence.length && keyOverLine) {
    return Math.floor(keyDist / (KEY_SIZE + KEY_SPACING));
  }
  return undefined;
}

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
            border={`4px solid ${color}`}
            bgcolor={color}
            borderRadius={5}
            width={KEY_SIZE}
            height={KEY_SIZE}
            marginTop={`${KEY_SPACING}px`}
            display='flex'
            justifyContent='center'
            alignItems='center'>
            <Typography style={{ color: 'white', fontSize: 'x-large', fontWeight: 900 }}>
              {symbolForKey(numberKey)}
            </Typography>
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
 * not restart on re-renders caused by changes to {@link useKeyResults} and
 * {@link useKeySequence}.
 *
 */
function KeyScrollContent({ danceController }: DanceControllerProps) {
  const keyResults = useKeyResults(danceController);
  const keySequence = useKeySequence(danceController);

  return (
    <div>
      {keySequence
        .map((key, i) => {
          const correct = i < keyResults.length ? keyResults[i] : undefined;
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
      animation: `$move ${danceController.duration}s linear`,
    },
    '@keyframes move': {
      from: {
        transform: 'translateY(-100%)',
      },
      to: {
        transform: `translateY(${VIEWER_HEIGHT}px)`,
      },
    },
  })();

  return (
    <Box>
      <Box
        width='100%'
        position='absolute'
        bottom={`${LINE_POS}px`}
        borderBottom='3px dashed black'></Box>
      <div className={classes.scrollingDiv}>
        <KeyScrollContent danceController={danceController}></KeyScrollContent>
      </div>
      <Box width='100%' position='absolute' top='0px' bgcolor='white'>
        <Typography style={{ padding: '25px' }}>
          Press the keys as they cross the dotted line to dance{' '}
        </Typography>
        <Divider></Divider>
      </Box>
    </Box>
  );
}

/**
 * NoActiveRound displays a message if there is currently no active round set.
 */
function NoActiveRound() {
  const classes = makeStyles({
    'dot1': { animation: `$show1 3s linear infinite` },
    'dot2': { animation: `$show2 3s linear infinite` },
    'dot3': { animation: `$show3 3s linear infinite` },
    '@keyframes show1': {
      '0%': { opacity: 0 },
      '25%': { opacity: 0 },
      '26%': { opacity: 1 },
      '100%': { opacity: 1 },
    },
    '@keyframes show2': {
      '0%': { opacity: 0 },
      '50%': { opacity: 0 },
      '51%': { opacity: 1 },
      '100%': { opacity: 1 },
    },
    '@keyframes show3': {
      '0%': { opacity: 0 },
      '75%': { opacity: 0 },
      '76%': { opacity: 1 },
      '100%': { opacity: 1 },
    },
  })();
  return (
    <Box display='flex' justifyContent='center' alignItems='center' height='100px'>
      <div>
        <Box component='span'>Waiting for next round</Box>
        <Box component='span' className={classes.dot1}>
          .
        </Box>
        <Box component='span' className={classes.dot2}>
          .
        </Box>
        <Box component='span' className={classes.dot3}>
          .
        </Box>
      </div>
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

  useEffect(() => {
    // start the round when the component mounts to sync with animation
    console.log(`component mounted: ${new Date().getTime()}`);
    danceController.roundStart = new Date();
  }, [activeRound, danceController]);

  return (
    <div
      className={overlayComponent}
      style={{
        maxHeight: `${VIEWER_HEIGHT}px`,
        minHeight: '100px',
        overflow: 'hidden',
        position: 'relative',
      }}>
      {activeRound ? (
        <KeyScrollView danceController={danceController}></KeyScrollView>
      ) : (
        <NoActiveRound></NoActiveRound>
      )}
    </div>
  );
}
