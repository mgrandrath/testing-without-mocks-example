import { EventEmitter } from "../utils/event-emitter";

type EventRecorder<Event> = {
  data: () => Event[];
};

export const recordEvents = <TEvent = unknown>(
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
