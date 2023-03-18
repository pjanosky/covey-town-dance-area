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
import { KeySequence } from '../../../types/CoveyTownSocket';

export function DanceKeys({ controller }: { controller: DanceAreaController }): JSX.Element {
  const keySequence = controller.keySequence;
  const keysPressed = controller.keysPressed;
  const townController = useTownController();

  /**
   * If the keys in keysPressed match the order of keys in keySequence then
   * we can emit a success dance move result.
   */
  return <></>;
}

export function DanceArea({ danceArea }: { danceArea: DanceAreaInteractable }): JSX.Element {
  const townController = useTownController();
  const danceAreaController = useDanceAreaController(danceArea.name);
  const [keysPressed, setKeysPressed] = useState(danceAreaController.keysPressed);
  useEffect(() => {
    const setKeys = (keys: KeySequence) => {
      setKeysPressed(keys);
    };
    danceAreaController.addListener('newKeyPressed', setKeys);
    return () => {
      danceAreaController.removeListener('newKeyPressed', setKeys);
    };
  }, [danceAreaController, townController]);

  if (!keysPressed) {
    return <></>;
  }
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
