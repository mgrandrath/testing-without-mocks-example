import NodeEventEmitter from "node:events";

export interface InfrastructureEvent<
  TPrefix extends string,
  TName extends string
> {
  type: `${TPrefix}/${TName}`;
  payload: unknown;
}

type EventListener<TEvent extends InfrastructureEvent<string, string>> = (
  event: TEvent
) => void;

const EVENT_TYPE = Symbol("eventType");

export class EventEmitter<TEvent extends InfrastructureEvent<string, string>> {
  #emitter: NodeEventEmitter;

  constructor() {
    this.#emitter = new NodeEventEmitter();
  }

  addListener(listener: EventListener<TEvent>) {
    this.#emitter.addListener(EVENT_TYPE, listener);

    return () => {
      this.removeListener(listener);
    };
  }

  removeListener(listener: EventListener<TEvent>) {
    this.#emitter.removeListener(EVENT_TYPE, listener);
  }

  emit(myEvent: TEvent) {
    this.#emitter.emit(EVENT_TYPE, myEvent);
  }
}
