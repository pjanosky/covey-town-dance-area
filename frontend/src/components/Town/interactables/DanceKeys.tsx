import React, { useEffect, useState } from 'react';

import { useDanceAreaController, useInteractable } from '../../../classes/TownController';
import useTownController from '../../../hooks/useTownController';

import DanceAreaInteractable from './DanceArea';
import { DanceMoveResult, NumberKey } from '../../../types/CoveyTownSocket';

/**
 *  The DanceArea monitors player's interactions in a DanceArea on the map. Specifically,
 * handling the key press logic.
 *
 * @param props the dance aera interactable that is being interacted with
 */
export function DanceArea({ danceArea }: { danceArea: DanceAreaInteractable }): JSX.Element {
  const townController = useTownController();
  const curPlayerId = townController.ourPlayer.id;
  const danceAreaController = useDanceAreaController(danceArea.name);
  const keysPressed = danceAreaController.keysPressed;
  const keySequence = danceAreaController.keySequence;
  const danceMoveResult: DanceMoveResult = {
    interactableID: danceAreaController.id,
    playerId: curPlayerId,
    roundId: danceAreaController.roundId,
    success: true,
  };
  const newKey = (key: NumberKey) => {
    const currentIndex = keysPressed.length;
    if (key == keySequence[currentIndex + 1]) {
      danceAreaController.emit('numberPressed', key);
      danceAreaController.emit('danceMove', danceMoveResult);
    }
  };
  danceAreaController.addListener('numberPressed', newKey);
  return <></>;
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
