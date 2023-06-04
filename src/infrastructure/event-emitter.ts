import NodeEventEmitter from "node:events";
import { EventListener, InfrastructureEvent } from "../request-handlers/types";

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
