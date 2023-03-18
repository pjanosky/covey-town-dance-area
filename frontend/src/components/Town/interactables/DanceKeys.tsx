import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useToast,
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { useDanceAreaController, useInteractable } from '../../../classes/TownController';
import useTownController from '../../../hooks/useTownController';
import DanceAreaController from '../../../classes/DanceAreaController';
import DanceAreaInteractable from './DanceArea';
import { DanceMoveResult, KeySequence, NumberKey } from '../../../types/CoveyTownSocket';

/**
 * If the keys in keysPressed match the order of keys in keySequence then
 * we can emit a success dance move result.
 * - Are we checking that the entirety of both lists are the same (i.e., their
 * lengths are the same)?
 * - Are we checking that a new key pressed (added to the keysPressed list)
 * matches the next key in the keySequence? (i.e., assuming that the keys
 * so far in the lists are matching)? --> this one
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
