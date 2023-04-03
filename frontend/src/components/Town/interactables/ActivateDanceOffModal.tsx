import {
  Button,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useToast,
} from '@chakra-ui/react';
import { nanoid } from 'nanoid';
import React, { useCallback, useEffect } from 'react';
import { useDanceAreaController } from '../../../classes/TownController';
import useTownController from '../../../hooks/useTownController';
import { DanceArea as DanceAreaModel } from '../../../types/CoveyTownSocket';
import { DanceArea } from './DanceArea';

export default function BeginDanceOffModal({
  isOpen,
  close,
  danceArea,
}: {
  isOpen: boolean;
  close: () => void;
  danceArea: DanceArea;
}): JSX.Element {
  const coveyTownController = useTownController();
  const danceAreaController = useDanceAreaController(danceArea?.name);

  const roundId = nanoid();

  useEffect(() => {
    if (isOpen) {
      coveyTownController.pause();
    } else {
      coveyTownController.unPause();
    }
  }, [coveyTownController, isOpen]);

  const closeModal = useCallback(() => {
    coveyTownController.unPause();
    close();
  }, [coveyTownController, close]);

  const toast = useToast();

  const createDanceArea = useCallback(async () => {
    if (roundId && danceAreaController) {
      const request: DanceAreaModel = {
        id: danceAreaController.id,
        roundId,
        music: [],
        duration: 20,
        points: {},
        keySequence: [],
      };
      try {
        await coveyTownController.createDanceArea(request);
        toast({
          title: 'Dance off started!',
          status: 'success',
        });
        coveyTownController.unPause();
      } catch (err) {
        if (err instanceof Error) {
          toast({
            title: 'unable to begin dance off',
            description: err.toString(),
            status: 'error',
          });
        } else {
          console.trace(err);
          toast({
            title: 'Unexpected Error',
            status: 'error',
          });
        }
      }
    }
  }, [roundId, coveyTownController, danceAreaController, toast]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        closeModal();
        coveyTownController.unPause();
      }}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Begin Dance off in {danceAreaController?.id} </ModalHeader>
        <ModalCloseButton />
        <form
          onSubmit={ev => {
            ev.preventDefault();
            createDanceArea();
          }}>
          <ModalFooter>
            <Button colorScheme='blue' mr={3} onClick={createDanceArea}>
              Begin Dance off!
            </Button>
            <Button onClick={closeModal}>Cancel</Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
