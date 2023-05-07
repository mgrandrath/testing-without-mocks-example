import EventEmitter from "node:events";

type EventRecorder<Event> = {
  data: () => Event[];
};

export const recordEvents = <Event>(
  emitter: EventEmitter,
  eventType: string
): EventRecorder<Event> => {
  const events: Event[] = [];

  const handleEvent = (event: Event) => events.push(event);
  emitter.on(eventType, handleEvent);

  return {
    data: () => [...events],
  };
};
