import {
  Button,
  FormControl,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useToast,
} from '@chakra-ui/react';
import React, { useCallback, useEffect, useState } from 'react';
import DanceAreaController from '../../../classes/DanceAreaController';
import TownController from '../../../classes/TownController';

export default function SelectMusicModal({
  isOpen,
  close,
  danceController,
  townController,
}: {
  isOpen: boolean;
  close: () => void;
  danceController: DanceAreaController;
  townController: TownController;
}): JSX.Element {
  const [music, setMusic] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      townController.pause();
    } else {
      townController.unPause();
    }
  }, [townController, isOpen]);

  const closeModal = useCallback(() => {
    townController.unPause();
    close();
  }, [townController, close]);

  const toast = useToast();

  const addToQueue = useCallback(async () => {
    if (music && townController) {
      try {
        await townController.queueDanceAreaTrack(danceController, music);
        townController.unPause();
      } catch (err) {
        if (err instanceof Error) {
          toast({
            title: 'Unable to add song to queue',
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
  }, [music, townController, danceController, toast]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        closeModal();
        townController.unPause();
      }}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Enter a Spotify link to queue here!</ModalHeader>
        <ModalCloseButton />
        <form
          onSubmit={link => {
            link.preventDefault();
            addToQueue();
          }}>
          <ModalBody pb={6}>
            <FormControl>
              <FormLabel htmlFor='music'>Spotify URL</FormLabel>
              <Input
                id='spotify'
                name='spotify'
                value={music}
                onChange={e => setMusic(e.target.value)}
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme='blue' mr={3} onClick={addToQueue}>
              Set music
            </Button>
            <Button onClick={closeModal}>Cancel</Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
