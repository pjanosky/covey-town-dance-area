import React, { useEffect } from 'react';

import { useDanceAreaController, useInteractable } from '../../../classes/TownController';
import useTownController from '../../../hooks/useTownController';

import DanceAreaInteractable from './DanceArea';
import { DanceMoveResult, NumberKey } from '../../../types/CoveyTownSocket';
import { useKeyPressed, useKeySequence } from '../../../classes/DanceAreaController';

/**
 * DanceKeyViewer displays the keystrokes the user has to press for the current round.
 * It animates a bar that crosses the keys to show the user when to press each key.
 */
function DanceKeyViewer(): JSX.Element {
  return <span> dance key viewer here </span>;
}

/**
 *  The DanceArea monitors player's interactions in a DanceArea on the map. Specifically,
 * handling the key press logic.
 *
 * @param props the dance aera interactable that is being interacted with
 */
export function DanceArea({ danceArea }: { danceArea: DanceAreaInteractable }): JSX.Element {
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

  return <DanceKeyViewer></DanceKeyViewer>;
}

/**
 * The DanceKeysWrapper is suitable to be always rendered inside of a town, and
 * will activate only if the player begins interacting with a dance area.
 */
export default function DanceKeysWrapper(): JSX.Element {
  const danceArea = useInteractable<DanceAreaInteractable>('danceArea');
  if (danceArea) {
    return <DanceArea danceArea={danceArea} />;
  }
  return <></>;
}
