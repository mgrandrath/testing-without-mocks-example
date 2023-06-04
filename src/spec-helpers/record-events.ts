import { IEventEmitter, InfrastructureEvent } from "../request-handlers/types";

type EventRecorder<Event> = {
  data: () => Event[];
};

export const recordEvents = <
  TEvent extends InfrastructureEvent<string, string>
>(
  eventEmitter: IEventEmitter<TEvent>
): EventRecorder<TEvent> => {
  const events: TEvent[] = [];

  eventEmitter.addListener((event) => {
    events.push(event);
  });

  return {
    data: () => [...events],
  };
};
