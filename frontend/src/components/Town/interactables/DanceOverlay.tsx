import React, { useEffect } from 'react';

import { useDanceAreaController, useInteractable } from '../../../classes/TownController';
import useTownController from '../../../hooks/useTownController';

import { DanceArea as DanceAreaInteractable } from './DanceArea';
import { DanceMoveResult, NumberKey } from '../../../types/CoveyTownSocket';
import DanceAreaController from '../../../classes/DanceAreaController';

/**
 * DanceKeyHandler responds to keys pressed by the player while in a dance interactable area.
 * It checks to see if the right key was pressed based on the key sequence of the current
 * round, and emits a DanceMoveResult to the dance area controller and covey town socket.
 *
 * @param props the dance area interactable that is being interacted with
 */
export function DanceKeyHandler({
  danceController,
}: {
  danceController: DanceAreaController;
}): JSX.Element {
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

  return <></>;
}

/**
 * Dance overlay displays all of the overlay components for a dance interactable area
 * including the keys the user needs to press, the leaderboard, and the music player.
 * It also handles key presses made by the user while in the area.
 */
export function DanceOverlay({ danceArea }: { danceArea: DanceAreaInteractable }): JSX.Element {
  const danceController = useDanceAreaController(danceArea.id);

  return (
    <>
      <DanceKeyHandler danceController={danceController}></DanceKeyHandler>
    </>
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
    return <DanceOverlay danceArea={danceArea} />;
  }
  return <></>;
}
