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
import DanceAreaController, { useMusic } from '../../../classes/DanceAreaController';
import TownController from '../../../classes/TownController';

function Queue(danceController: DanceAreaController): JSX.Element {
  const queue = useMusic(danceController);
  let arr: string[] = [];
  const title = 'Title: ';
  const album = 'Album: ';
  const artist = 'Artist: ';

  for (let i = 0; i < queue.length; i++) {
    arr = arr.concat(
      title.concat(queue[i].title as string),
      album.concat(queue[i].album as string),
      artist.concat(queue[i].artist as string),
    );
  }

  return (
    <ul style={{ listStyleType: 'decimal' }}>
      {arr.map(item => {
        return <p key={item.toString()}>{item}</p>;
      })}
    </ul>
  );
}

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
        const isQueued = await townController.queueDanceAreaTrack(danceController, music);
        if (isQueued) {
          toast({
            title: 'Song added to queue!',
            status: 'success',
          });
        } else {
          toast({
            title: 'Unable to add song to queue',
            status: 'error',
          });
        }
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
                id='music'
                name='music'
                value={music}
                onChange={e => setMusic(e.target.value)}
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme='blue' mr={3} onClick={addToQueue}>
              Add to queue
            </Button>
            <Button onClick={closeModal}>Cancel</Button>
          </ModalFooter>
        </form>
        <ModalHeader>Current Queue</ModalHeader>
        {Queue(danceController)}
      </ModalContent>
    </Modal>
  );
}
