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
import { Rating } from '../../../types/CoveyTownSocket';
import { nameForPlayer } from './DanceOverlay';

/**
 * The modal where a user can rate another user on their dance moves.
 * @param modalParams includes if the modal is open, how to close the modal, dance controller, town controller, player to be rated
 * @returns frontend rating modal
 */
export default function RatingModal({
  isOpen,
  close,
  danceController,
  townController,
  playerId,
}: {
  isOpen: boolean;
  close: () => void;
  danceController: DanceAreaController;
  townController: TownController;
  playerId: string;
}): JSX.Element {
  const [rating, setRating] = useState<Rating>(3);

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

  const ratePlayer = useCallback(async () => {
    if (rating && townController) {
      try {
        const danceRating = {
          interactableID: danceController.id,
          sender: townController.ourPlayer.id,
          recipient: playerId,
          rating: rating,
        };
        townController.emitDanceRating(danceRating);
        closeModal();
        toast({
          title: 'Player has been rated!',
          status: 'success',
        });
        townController.unPause();
      } catch (err) {
        if (err instanceof Error) {
          toast({
            title: 'Unable to rate player',
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
  }, [rating, townController, danceController.id, playerId, closeModal, toast]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        closeModal();
        townController.unPause();
      }}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          Enter your rating for {nameForPlayer(townController, playerId)} here!
        </ModalHeader>
        <ModalCloseButton />
        <form
          onSubmit={link => {
            link.preventDefault();
            ratePlayer();
          }}>
          <ModalBody pb={6}>
            <FormControl>
              <FormLabel htmlFor='rating'>Rate the player {rating} points</FormLabel>
              <Input
                type='range'
                id='rating'
                name='rating'
                min='1'
                max='5'
                step='1'
                value={rating}
                onChange={e => setRating(Number(e.target.value) as Rating)}
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme='blue' mr={3} onClick={ratePlayer}>
              Send
            </Button>
            <Button onClick={closeModal}>Cancel</Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
