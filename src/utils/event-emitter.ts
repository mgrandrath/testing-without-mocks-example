import NodeEventEmitter from "node:events";

type Listener<TEvent> = (event: TEvent) => void;

export class EventEmitter<TEvent> {
  #eventName: symbol;
  #emitter: NodeEventEmitter;

  constructor() {
    this.#eventName = Symbol("eventName");
    this.#emitter = new NodeEventEmitter();
  }

  addListener(listener: Listener<TEvent>) {
    this.#emitter.addListener(this.#eventName, listener);
    return () => {
      this.removeListener(listener);
    };
  }

  removeListener(listener: Listener<TEvent>) {
    this.#emitter.removeListener(this.#eventName, listener);
  }

  emit(event: TEvent) {
    this.#emitter.emit(this.#eventName, event);
  }
}
