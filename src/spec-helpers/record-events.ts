import {
  EventEmitter,
  InfrastructureEvent,
} from "../infrastructure/event-emitter";

type EventRecorder<Event> = {
  data: () => Event[];
};

export const recordEvents = <
  TEvent extends InfrastructureEvent<string, string>
>(
  eventEmitter: EventEmitter<TEvent>
): EventRecorder<TEvent> => {
  const events: TEvent[] = [];

  eventEmitter.addListener((event) => {
    events.push(event);
  });

  return {
    data: () => [...events],
  };
};
