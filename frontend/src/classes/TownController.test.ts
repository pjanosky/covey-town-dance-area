import { EventParams } from '@socket.io/component-emitter';
import { mock, mockClear, MockProxy } from 'jest-mock-extended';
import { nanoid } from 'nanoid';
import { LoginController } from '../contexts/LoginControllerContext';
import { ViewingArea } from '../generated/client';
import { PosterSessionArea } from '../generated/client';
import {
  EventNames,
  getEventListener,
  mockTownControllerConnection,
  ReceivedEventParameter,
} from '../TestUtils';
import {
  ChatMessage,
  ConversationArea,
  ConversationArea as ConversationAreaModel,
  CoveyTownSocket,
  DanceArea,
  DanceMoveResult,
  DanceRating,
  Player as PlayerModel,
  PlayerLocation,
  ServerToClientEvents,
  TownJoinResponse,
} from '../types/CoveyTownSocket';
import {
  isConversationArea,
  isDanceArea,
  isPosterSessionArea,
  isViewingArea,
} from '../types/TypeUtils';
import DanceAreaController, { DanceAreaEvents } from './DanceAreaController';
import PlayerController from './PlayerController';
import PosterSessionAreaController from './PosterSessionAreaController';
import TownController, { TownEvents } from './TownController';
import ViewingAreaController from './ViewingAreaController';

/**
 * Mocks the socket-io client constructor such that it will always return the same
 * mockSocket instance. Returns that mockSocket instance to the caller of this function,
 * allowing tests to make assertions about the messages emitted to the socket, and also to
 * simulate the receipt of events, @see getEventListener
 */
const mockSocket = mock<CoveyTownSocket>();
jest.mock('socket.io-client', () => {
  const actual = jest.requireActual('socket.io-client');
  return {
    ...actual,
    io: () => mockSocket,
  };
});

describe('TownController', () => {
  let mockLoginController: MockProxy<LoginController>;
  let userName: string;
  let townID: string;
  beforeAll(() => {
    mockLoginController = mock<LoginController>();
    process.env.REACT_APP_TOWNS_SERVICE_URL = 'test';
  });
  let testController: TownController;

  /**
   * Testing harness that mocks the arrival of an event from the CoveyTownSocket and expects that
   * a given listener is invoked, optionally with an expected listener parameter.
   *
   * Returns a mock listener callback that represents the listener under expectation
   *
   * @param receivedEvent
   * @param receivedParameter
   * @param listenerToExpect
   * @param expectedListenerParam
   * @returns mock listener mock
   */
  const emitEventAndExpectListenerFiring = <
    ReceivedEventFromSocket extends EventNames<ServerToClientEvents>,
    ExpectedListenerName extends EventNames<TownEvents>,
  >(
    receivedEvent: ReceivedEventFromSocket,
    receivedParameter: ReceivedEventParameter<ReceivedEventFromSocket>,
    listenerToExpect: ExpectedListenerName,
    expectedListenerParam?: Parameters<TownEvents[ExpectedListenerName]>[0],
  ): jest.MockedFunction<TownEvents[ExpectedListenerName]> => {
    const eventListener = getEventListener(mockSocket, receivedEvent);
    const mockListener = jest.fn() as jest.MockedFunction<TownEvents[ExpectedListenerName]>;
    testController.addListener(listenerToExpect, mockListener);
    eventListener(receivedParameter);
    if (expectedListenerParam === undefined) {
      expect(mockListener).toHaveBeenCalled();
    } else {
      expect(mockListener).toHaveBeenCalledWith(expectedListenerParam);
    }
    return mockListener;
  };

  beforeEach(() => {
    mockClear(mockSocket);
    userName = nanoid();
    townID = nanoid();
    testController = new TownController({ userName, townID, loginController: mockLoginController });
  });
  describe('With an unsuccesful connection', () => {
    it('Throws an error', async () => {
      mockSocket.on.mockImplementation((eventName, eventListener) => {
        if (eventName === 'disconnect') {
          const listener = eventListener as () => void;
          listener();
        }
        return mockSocket;
      });
      await expect(testController.connect()).rejects.toThrowError();
      mockSocket.on.mockReset();
    });
  });
  describe('With a successful connection', () => {
    let townJoinResponse: TownJoinResponse;

    beforeEach(async () => {
      townJoinResponse = await mockTownControllerConnection(testController, mockSocket);
    });
    it('Initializes the properties of the controller', () => {
      expect(testController.providerVideoToken).toEqual(townJoinResponse.providerVideoToken);
      expect(testController.friendlyName).toEqual(townJoinResponse.friendlyName);
      expect(testController.townIsPubliclyListed).toEqual(townJoinResponse.isPubliclyListed);
      expect(testController.sessionToken).toEqual(townJoinResponse.sessionToken);
      expect(testController.userID).toEqual(townJoinResponse.userID);
    });
    it('initializes the interactables in the controller', () => {
      const conversationAreas = townJoinResponse.interactables.filter(area =>
        isConversationArea(area),
      ) as ConversationArea[];
      const viewingAreas = townJoinResponse.interactables.filter(area =>
        isViewingArea(area),
      ) as ViewingArea[];
      const posterSessionAreas = townJoinResponse.interactables.filter(area =>
        isPosterSessionArea(area),
      ) as PosterSessionArea[];
      const danceAreas = townJoinResponse.interactables.filter(area =>
        isDanceArea(area),
      ) as DanceArea[];

      conversationAreas.forEach(conversationArea =>
        expect(
          testController.conversationAreas.find(area => area.id == conversationArea.id),
        ).toBeDefined(),
      );
      viewingAreas.forEach(viewingArea =>
        expect(testController.viewingAreas.find(area => area.id == viewingArea.id)).toBeDefined(),
      );
      posterSessionAreas.forEach(posterSessionArea =>
        expect(
          testController.posterSessionAreas.find(area => area.id == posterSessionArea.id),
        ).toBeDefined(),
      );
      danceAreas.forEach(danceArea =>
        expect(testController.danceAreas.find(area => area.id == danceArea.id)).toBeDefined(),
      );
    });
    it('Forwards update town calls to local CoveyTownEvents listeners', () => {
      const newFriendlyName = nanoid();
      emitEventAndExpectListenerFiring(
        'townSettingsUpdated',
        { friendlyName: newFriendlyName },
        'townSettingsUpdated',
        { friendlyName: newFriendlyName },
      );
    });
    it('Forwards delete town calls to local CoveyTownEvents listeners', () => {
      emitEventAndExpectListenerFiring('townClosing', undefined, 'disconnect', undefined);
    });
    it('Forwards chat messages to local CoveyTownEvents listeners', () => {
      const message: ChatMessage = {
        author: nanoid(),
        body: nanoid(),
        dateCreated: new Date(),
        sid: nanoid(),
      };
      emitEventAndExpectListenerFiring('chatMessage', message, 'chatMessage', message);
    });
    it("Emits the local player's movement updates to the socket and to locally subscribed CoveyTownEvents listeners", () => {
      const newLocation: PlayerLocation = { ...testController.ourPlayer.location, x: 10, y: 10 };
      const expectedPlayerUpdate = testController.ourPlayer;
      expectedPlayerUpdate.location = newLocation;
      const movedPlayerListener = jest.fn();

      testController.addListener('playerMoved', movedPlayerListener);

      testController.emitMovement(newLocation);

      //Emits the event to the socket
      expect(mockSocket.emit).toBeCalledWith('playerMovement', newLocation);

      //Emits the playerMovement event to locally subscribed listerners, indicating that the player moved
      expect(movedPlayerListener).toBeCalledWith(expectedPlayerUpdate);

      //Uses the correct (new) location when emitting that update locally
      expect(expectedPlayerUpdate.location).toEqual(newLocation);
    });
    it('Emits locally written chat messages to the socket, and dispatches no other events', () => {
      const testMessage: ChatMessage = {
        author: nanoid(),
        body: nanoid(),
        dateCreated: new Date(),
        sid: nanoid(),
      };
      testController.emitChatMessage(testMessage);

      expect(mockSocket.emit).toBeCalledWith('chatMessage', testMessage);
    });
    it('Emits conversationAreasChanged when a conversation area is created', () => {
      const newConvArea = townJoinResponse.interactables.find(
        eachInteractable => isConversationArea(eachInteractable) && !eachInteractable.topic,
      ) as ConversationAreaModel;
      if (newConvArea) {
        newConvArea.topic = nanoid();
        newConvArea.occupantsByID = [townJoinResponse.userID];
        const event = emitEventAndExpectListenerFiring(
          'interactableUpdate',
          newConvArea,
          'conversationAreasChanged',
        );
        const changedAreasArray = event.mock.calls[0][0];
        expect(changedAreasArray.find(eachConvArea => eachConvArea.id === newConvArea.id)?.topic);
      } else {
        fail('Did not find an existing, empty conversation area in the town join response');
      }
    });
    it('Emits locally created dance move result to the socket, and dispatches no other events', () => {
      const testDanceMoveResult: DanceMoveResult = {
        interactableID: nanoid(),
        playerId: nanoid(),
        roundId: nanoid(),
        success: true,
      };
      testController.emitDanceMove(testDanceMoveResult);
      expect(mockSocket.emit).toBeCalledWith('danceMove', testDanceMoveResult);
    });
    it('Emits locally created dance rating to the socket, and dispatches no other events', () => {
      const testDanceRating: DanceRating = {
        interactableID: nanoid(),
        sender: nanoid(),
        recipient: nanoid(),
        rating: 5,
      };
      testController.emitDanceRating(testDanceRating);
      expect(mockSocket.emit).toBeCalledWith('danceRating', testDanceRating);
    });
    describe('[T2] interactableUpdate events', () => {
      describe('Conversation Area updates', () => {
        function emptyConversationArea() {
          return {
            ...(townJoinResponse.interactables.find(
              eachInteractable =>
                isConversationArea(eachInteractable) && eachInteractable.occupantsByID.length == 0,
            ) as ConversationAreaModel),
          };
        }
        function occupiedConversationArea() {
          return {
            ...(townJoinResponse.interactables.find(
              eachInteractable =>
                isConversationArea(eachInteractable) && eachInteractable.occupantsByID.length > 0,
            ) as ConversationAreaModel),
          };
        }
        it('Emits a conversationAreasChanged event with the updated list of conversation areas if the area is newly occupied', () => {
          const convArea = emptyConversationArea();
          convArea.occupantsByID = [townJoinResponse.userID];
          convArea.topic = nanoid();
          const updatedConversationAreas = testController.conversationAreas;

          emitEventAndExpectListenerFiring(
            'interactableUpdate',
            convArea,
            'conversationAreasChanged',
            updatedConversationAreas,
          );

          const updatedController = updatedConversationAreas.find(
            eachArea => eachArea.id === convArea.id,
          );
          expect(updatedController?.topic).toEqual(convArea.topic);
          expect(updatedController?.occupants.map(eachOccupant => eachOccupant.id)).toEqual(
            convArea.occupantsByID,
          );
          expect(updatedController?.toConversationAreaModel()).toEqual({
            id: convArea.id,
            topic: convArea.topic,
            occupantsByID: [townJoinResponse.userID],
          });
        });
        it('Emits a conversationAreasChanged event with the updated list of converation areas if the area is newly vacant', () => {
          const convArea = occupiedConversationArea();
          convArea.occupantsByID = [];
          convArea.topic = undefined;
          const updatedConversationAreas = testController.conversationAreas;

          emitEventAndExpectListenerFiring(
            'interactableUpdate',
            convArea,
            'conversationAreasChanged',
            updatedConversationAreas,
          );
          const updatedController = updatedConversationAreas.find(
            eachArea => eachArea.id === convArea.id,
          );
          expect(updatedController?.topic).toEqual(convArea.topic);
          expect(updatedController?.occupants.map(eachOccupant => eachOccupant.id)).toEqual(
            convArea.occupantsByID,
          );
        });
        it('Does not emit a conversationAreasChanged event if the set of active areas has not changed', () => {
          const convArea = occupiedConversationArea();
          convArea.topic = nanoid();
          const updatedConversationAreas = testController.conversationAreas;

          const eventListener = getEventListener(mockSocket, 'interactableUpdate');
          const mockListener = jest.fn() as jest.MockedFunction<
            TownEvents['conversationAreasChanged']
          >;
          testController.addListener('conversationAreasChanged', mockListener);
          eventListener(convArea);
          expect(mockListener).not.toBeCalled();

          const updatedController = updatedConversationAreas.find(
            eachArea => eachArea.id === convArea.id,
          );
          expect(updatedController?.topic).toEqual(convArea.topic);
          expect(updatedController?.occupants.map(eachOccupant => eachOccupant.id)).toEqual(
            convArea.occupantsByID,
          );
        });
        it('Emits a topicChange event if the topic of a conversation area changes', () => {
          const convArea = occupiedConversationArea();
          convArea.topic = nanoid();
          //Set up a topicChange listener
          const topicChangeListener = jest.fn();
          const convAreaController = testController.conversationAreas.find(
            eachArea => eachArea.id === convArea.id,
          );
          if (!convAreaController) {
            fail('Could not find conversation area controller');
            return;
          }
          convAreaController.addListener('topicChange', topicChangeListener);

          // Perform the update
          const eventListener = getEventListener(mockSocket, 'interactableUpdate');
          eventListener(convArea);

          expect(topicChangeListener).toBeCalledWith(convArea.topic);
        });
        it('Does not emit a topicChange event if the topic is unchanged', () => {
          const convArea = occupiedConversationArea();
          //Set up a topicChange listener
          const topicChangeListener = jest.fn();
          const convAreaController = testController.conversationAreas.find(
            eachArea => eachArea.id === convArea.id,
          );
          if (!convAreaController) {
            fail('Could not find conversation area controller');
          }
          convAreaController.addListener('topicChange', topicChangeListener);

          // Perform the update
          const eventListener = getEventListener(mockSocket, 'interactableUpdate');
          eventListener(convArea);

          expect(topicChangeListener).not.toBeCalled();
        });
        it('Emits an occupantsChange event if the occupants changed', () => {
          const convArea = occupiedConversationArea();
          convArea.occupantsByID = [townJoinResponse.userID, townJoinResponse.currentPlayers[1].id];

          //Set up an occupantsChange listener
          const occupantsChangeListener = jest.fn();
          const convAreaController = testController.conversationAreas.find(
            eachArea => eachArea.id === convArea.id,
          );
          if (!convAreaController) {
            fail('Could not find conversation area controller');
          }
          convAreaController.addListener('occupantsChange', occupantsChangeListener);

          // Perform the update
          const eventListener = getEventListener(mockSocket, 'interactableUpdate');
          eventListener(convArea);

          expect(occupantsChangeListener).toBeCalledTimes(1);
        });
        it('Does not emit an occupantsChange if the occupants have not changed', () => {
          const convArea = occupiedConversationArea();
          convArea.topic = nanoid();

          //Set up an occupantsChange listener
          const occupantsChangeListener = jest.fn();
          const convAreaController = testController.conversationAreas.find(
            eachArea => eachArea.id === convArea.id,
          );
          if (!convAreaController) {
            fail('Could not find conversation area controller');
          }
          convAreaController.addListener('occupantsChange', occupantsChangeListener);

          // Perform the update
          const eventListener = getEventListener(mockSocket, 'interactableUpdate');
          eventListener(convArea);

          expect(occupantsChangeListener).not.toBeCalled();
        });
      });
      describe('Viewing Area updates', () => {
        function viewingAreaOnTown() {
          return {
            ...(townJoinResponse.interactables.find(eachInteractable =>
              isViewingArea(eachInteractable),
            ) as ViewingArea),
          };
        }
        let viewingArea: ViewingArea;
        let viewingAreaController: ViewingAreaController;
        let eventListener: (update: ViewingArea) => void;
        beforeEach(() => {
          viewingArea = viewingAreaOnTown();
          const controller = testController.viewingAreas.find(
            eachArea => eachArea.id === viewingArea.id,
          );
          if (!controller) {
            fail(`Could not find viewing area controller for viewing area ${viewingArea.id}`);
          }
          viewingAreaController = controller;
          eventListener = getEventListener(mockSocket, 'interactableUpdate');
        });
        it('Updates the viewing area model', () => {
          viewingArea.video = nanoid();
          viewingArea.elapsedTimeSec++;
          viewingArea.isPlaying = !viewingArea.isPlaying;

          eventListener(viewingArea);

          expect(viewingAreaController.viewingAreaModel()).toEqual(viewingArea);
        });
        it('Emits a playbackChange event if isPlaying changes', () => {
          const listener = jest.fn();
          viewingAreaController.addListener('playbackChange', listener);

          viewingArea.isPlaying = !viewingArea.isPlaying;
          eventListener(viewingArea);
          expect(listener).toBeCalledWith(viewingArea.isPlaying);
        });
        it('Emits a progressChange event if the elapsedTimeSec chagnes', () => {
          const listener = jest.fn();
          viewingAreaController.addListener('progressChange', listener);

          viewingArea.elapsedTimeSec++;
          eventListener(viewingArea);
          expect(listener).toBeCalledWith(viewingArea.elapsedTimeSec);
        });
        it('Emits a videoChange event if the video changes', () => {
          const listener = jest.fn();
          viewingAreaController.addListener('videoChange', listener);

          viewingArea.video = nanoid();
          eventListener(viewingArea);
          expect(listener).toBeCalledWith(viewingArea.video);
        });
      });
      describe('[REE1] PosterSessionAreaController Poster Session Area updates', () => {
        function posterSessionAreaOnTown() {
          return {
            ...(townJoinResponse.interactables.find(eachInteractable =>
              isPosterSessionArea(eachInteractable),
            ) as PosterSessionArea),
          };
        }
        let posterSessionArea: PosterSessionArea;
        let posterSessionAreaController: PosterSessionAreaController;
        let eventListener: (update: PosterSessionArea) => void;
        beforeEach(() => {
          posterSessionArea = posterSessionAreaOnTown();
          const controller = testController.posterSessionAreas.find(
            eachArea => eachArea.id === posterSessionArea.id,
          );
          if (!controller) {
            fail(
              `Could not find postersession area controller for poster session area ${posterSessionArea.id}`,
            );
          }
          posterSessionAreaController = controller;
          eventListener = getEventListener(mockSocket, 'interactableUpdate');
        });
        it('[REE1] interactableUpdate and poster hooks Updates the poster session area model', () => {
          posterSessionArea.imageContents = nanoid();
          posterSessionArea.stars++;
          posterSessionArea.title = 'New Title';

          eventListener(posterSessionArea);

          expect(posterSessionAreaController.posterSessionAreaModel()).toEqual(posterSessionArea);
        });
        it('[REE1] interactableUpdate and poster hooks Emits a posterStarChange event if the number of stars changes', () => {
          const listener = jest.fn();
          posterSessionAreaController.addListener('posterStarChange', listener);

          posterSessionArea.stars++;
          eventListener(posterSessionArea);
          expect(listener).toBeCalledWith(posterSessionArea.stars);
        });
        it('[REE1] interactableUpdate and poster hooks Emits a posterTitleEvent event if the title changes', () => {
          const listener = jest.fn();
          posterSessionAreaController.addListener('posterTitleChange', listener);

          posterSessionArea.title = nanoid();
          eventListener(posterSessionArea);
          expect(listener).toBeCalledWith(posterSessionArea.title);
        });
        it('[REE1] interactableUpdate and poster hooks Emits a posterImageContentsChange event if the image contents changes', () => {
          const listener = jest.fn();
          posterSessionAreaController.addListener('posterImageContentsChange', listener);

          posterSessionArea.imageContents = nanoid();
          eventListener(posterSessionArea);
          expect(listener).toBeCalledWith(posterSessionArea.imageContents);
        });
      });
    });
  });
  describe('Processing events that are received over the socket from the townService', () => {
    let testPlayer: PlayerModel;
    let testPlayerPlayersChangedFn: jest.MockedFunction<TownEvents['playersChanged']>;

    beforeEach(() => {
      //Create a new PlayerModel
      testPlayer = {
        id: nanoid(),
        location: { moving: false, rotation: 'back', x: 0, y: 1, interactableID: nanoid() },
        userName: nanoid(),
      };
      //Add that player to the test town
      testPlayerPlayersChangedFn = emitEventAndExpectListenerFiring(
        'playerJoined',
        testPlayer,
        'playersChanged',
      );
    });
    it('Emits playersChanged events when players join', () => {
      expect(testPlayerPlayersChangedFn).toBeCalledWith([
        PlayerController.fromPlayerModel(testPlayer),
      ]);
    });

    it('Emits playersChanged events when players leave', () => {
      emitEventAndExpectListenerFiring('playerDisconnect', testPlayer, 'playersChanged', []);
    });
    it('Emits playerMoved events when players join', async () => {
      emitEventAndExpectListenerFiring(
        'playerJoined',
        testPlayer,
        'playerMoved',
        PlayerController.fromPlayerModel(testPlayer),
      );
    });
    it('Emits playerMoved events when players move', async () => {
      testPlayer.location = {
        moving: true,
        rotation: 'front',
        x: 1,
        y: 0,
        interactableID: nanoid(),
      };
      emitEventAndExpectListenerFiring(
        'playerMoved',
        testPlayer,
        'playerMoved',
        PlayerController.fromPlayerModel(testPlayer),
      );
    });

    describe('test dance socket handlers', () => {
      let danceController: DanceAreaController;
      let danceModel: DanceArea;
      let danceMoveListener: jest.MockedFunction<DanceAreaEvents['danceMove']>;
      let danceRatingListener: jest.MockedFunction<DanceAreaEvents['danceRating']>;
      type DanceControllerEventName = EventNames<DanceAreaEvents>;

      beforeEach(async () => {
        mockTownControllerConnection(testController, mockSocket);
        if (testController.danceAreas.length === 0) {
          throw Error('no dance areas added to town');
        }
        danceController = testController.danceAreas[0];
        danceModel = danceController.danceAreaModel();
        danceMoveListener = jest.fn();
        danceRatingListener = jest.fn();
        danceController.addListener('danceMove', danceMoveListener);
        danceController.addListener('danceRating', danceRatingListener);
      });

      /**
       * Emits an event to the test TownController to simulate an event being received
       * from the backend.
       */
      const emitToTown = <ReceivedEventFromSocket extends EventNames<ServerToClientEvents>>(
        receivedEvent: ReceivedEventFromSocket,
        receivedParameter: ReceivedEventParameter<ReceivedEventFromSocket>,
      ) => {
        const eventListener = getEventListener(mockSocket, receivedEvent);
        eventListener(receivedParameter);
      };

      /**
       * Testing harness that expects that the given event is emitted to the
       * danceAreaController. If the `value` is supplied, this function expects
       * that the value passed to the listeners of this event matches the given
       * 'value'.
       *
       * This function is uses the mockEvent listeners set up in the `beforeAll`
       * function. It currently only works for 'danceMove' and 'danceRating' events.
       *
       * @param event The name of the event that is expected be be invoked
       * @param value The value that is passed to listeners.
       */
      const expectControllerEvent = <DanceEventName extends DanceControllerEventName>(
        event: DanceEventName,
        value: EventParams<DanceAreaEvents, DanceEventName>[0] | undefined = undefined,
      ) => {
        // typescript doesn't currently support type narrowing on generics so we have
        // to use the `any` type here.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const expectCall = (listener: jest.MockedFunction<any>) => {
          if (value) {
            expect(listener).toHaveBeenCalledWith(value);
          } else {
            expect(listener).toHaveBeenCalled();
          }
        };

        switch (event) {
          case 'danceMove':
            expectCall(danceMoveListener);
            break;
          case 'danceRating':
            expectCall(danceRatingListener);
            break;
          default:
            throw Error(`${event} event has not been implemented`);
        }
      };

      /**
       * Ensures that the given event has not been emitted from the dance
       * area controller.
       */
      const expectNoControllerEvent = (event: DanceControllerEventName) => {
        switch (event) {
          case 'danceMove':
            expect(danceMoveListener).toHaveBeenCalledTimes(0);
            break;
          case 'danceRating':
            expect(danceRatingListener).toHaveBeenCalledTimes(0);
            break;
          default:
            throw Error(`${event} event has not been implemented`);
        }
      };

      it('Forwards danceMove to controller when interactableID is valid', () => {
        const result: DanceMoveResult = {
          interactableID: danceModel.id,
          playerId: nanoid(),
          roundId: nanoid(),
          success: true,
        };
        emitToTown('danceMove', result);
        expectControllerEvent('danceMove', result);
      });
      it('Does not forward danceMove to controller when interactableID is invalid', () => {
        const result: DanceMoveResult = {
          interactableID: nanoid(),
          playerId: nanoid(),
          roundId: nanoid(),
          success: true,
        };
        emitToTown('danceMove', result);
        expectNoControllerEvent('danceMove');
      });
      it('Forwards danceRating to controller when interactableID is valid', () => {
        const rating: DanceRating = {
          interactableID: danceModel.id,
          sender: nanoid(),
          recipient: nanoid(),
          rating: 1,
        };
        emitToTown('danceRating', rating);
        expectControllerEvent('danceRating', rating);
      });
      it('Does not forward danceRating to controller when interactableID is invalid', () => {
        const rating: DanceRating = {
          interactableID: nanoid(),
          sender: nanoid(),
          recipient: nanoid(),
          rating: 1,
        };
        emitToTown('danceRating', rating);
        expectNoControllerEvent('danceRating');
      });
    });
  });
  describe('Dance Area Tests', () => {
    it('danceAreas setter update the dance areas', async () => {
      await mockTownControllerConnection(testController, mockSocket);
      const newArea = {
        id: nanoid(),
        music: nanoid(),
        roundId: nanoid(),
        keySequence: [],
        duration: 0,
        points: {},
      };
      expect(testController.danceAreas.find(area => area.id === newArea.id)).toBeUndefined();
      testController.danceAreas.push(new DanceAreaController(newArea));
      expect(testController.danceAreas.find(area => area.id === newArea.id)).toBeDefined();
    });
  });
  it('Disconnects the socket and clears the coveyTownController when disconnection', async () => {
    emitEventAndExpectListenerFiring('townClosing', undefined, 'disconnect');
    expect(mockLoginController.setTownController).toBeCalledWith(null);
  });
});
