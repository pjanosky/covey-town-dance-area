import React, { useEffect } from 'react';

import { useDanceAreaController, useInteractable } from '../../../classes/TownController';
import useTownController from '../../../hooks/useTownController';

import { DanceArea as DanceAreaInteractable } from './DanceArea';
import { DanceMoveResult, NumberKey } from '../../../types/CoveyTownSocket';

/**
 *  The DanceArea monitors player's interactions in a DanceArea on the map. Specifically,
 * handling the key press logic.
 *
 * @param props the dance area interactable that is being interacted with
 */
export function DanceOverlay({ danceArea }: { danceArea: DanceAreaInteractable }): JSX.Element {
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
        success: nextKeyIndex < keySequence.length && key === keySequence[nextKeyIndex],
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

  return <></>;
}

/**
 * The DanceKeysWrapper is suitable to be always rendered inside of a town, and
 * will activate only if the player begins interacting with a dance area.
 */
export default function DanceOverlayWrapper(): JSX.Element {
  const danceArea = useInteractable<DanceAreaInteractable>('danceArea');
  if (danceArea) {
    return <DanceOverlay danceArea={danceArea} />;
  }
  return <></>;
}
