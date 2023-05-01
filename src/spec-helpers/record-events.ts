import EventEmitter from "node:events";

type Events<Event> = Event[] & {
  consume: () => Event[];
  discard: () => void;
};

export const recordEvents = <Event>(
  emitter: EventEmitter,
  eventType: string
) => {
  const events: Event[] = [];

  const handleEvent = (event: Event) => events.push(event);
  emitter.on(eventType, handleEvent);

  const consume = () => {
    const result = [...events];
    events.length = 0;
    return result;
  };

  const discard = () => {
    emitter.off(eventType, handleEvent);
    consume();
  };

  // We define non-enumerable properties here b/c otherwise deep equal
  // comparisons fail.
  Object.defineProperty(events, "consume", {
    enumerable: false,
    value: consume,
  });
  Object.defineProperty(events, "discard", {
    enumerable: false,
    value: discard,
  });

  return events as Events<Event>;
};
