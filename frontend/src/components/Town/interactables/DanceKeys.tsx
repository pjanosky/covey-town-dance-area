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
import { useInteractable, usePosterSessionAreaController } from '../../../classes/TownController';
import PosterSessionAreaController, {
  useImageContents,
  useStars,
  useTitle,
} from '../../../classes/PosterSessionAreaController';
import useTownController from '../../../hooks/useTownController';
import DanceAreaController from '../../../classes/DanceAreaController';

export function keyPressedLogic({ controller }: { controller: DanceAreaController }): JSX.Element {
  const keySequence = controller.keySequence;
  const keysPressed = controller.keysPressed;
  <></>;
}

/**
 * The DanceKeysWrapper is suitable to be always rendered inside of a town, and
 * will activate only if the player begins interacting with a dance area.
 */
export default function DanceKeysWrapper(): JSX.Element {
  const danceArea = useInteractable<DanceArea>('danceArea');
  if (danceArea) {
    return <DanceKeys danceArea={danceArea} />;
  }
  return <></>;
}
