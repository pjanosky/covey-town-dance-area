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
  const coveyTownController = townController;
  const danceAreaController = danceController;

  const [music, setMusic] = useState<string>('');
  const spotifyRegex =
    '/^(?:spotify:|(?:https?://(?:open|play).spotify.com/))(?:embed)?/?(album|track)(?::|/)((?:[0-9a-zA-Z]){22})/';

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        closeModal();
        coveyTownController.unPause();
      }}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Enter a Spotify link to queue here!</ModalHeader>
        <ModalCloseButton />
        <form
          onKeyDown={m => {
            if (m.key === 'Enter') {
              if (m.currentTarget.value.match(spotifyRegex)) {
                coveyTownController.queueDanceAreaTrack(danceAreaController, m.currentTarget.value);
              } else {
                m.currentTarget.value = '';
              }
            }
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
            <Button colorScheme='blue' mr={3}>
              Set music
            </Button>
            <Button onClick={closeModal}>Cancel</Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
