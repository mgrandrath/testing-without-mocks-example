import { describe, expect, it, vi } from "vitest";
import { EventEmitter, InfrastructureEvent } from "./event-emitter";

describe("EventEmitter", () => {
  interface MyEvent extends InfrastructureEvent<"Test", "my-event"> {
    payload: { myProp: string };
  }

  const irrelevantEvent: MyEvent = {
    type: "Test/my-event",
    payload: { myProp: "irrelevant" },
  };

  it("should call all listeners with the emitted event", () => {
    const listenerA = vi.fn();
    const listenerB = vi.fn();
    const eventEmitter = new EventEmitter<MyEvent>();
    eventEmitter.addListener(listenerA);
    eventEmitter.addListener(listenerB);
    const myEvent: MyEvent = {
      type: "Test/my-event",
      payload: { myProp: "My Value" },
    };

    eventEmitter.emit(myEvent);

    expect(listenerA).toHaveBeenCalledWith(myEvent);
    expect(listenerB).toHaveBeenCalledWith(myEvent);
  });

  it("should call a listener multiple times when it has been added multiple times", () => {
    const listener = vi.fn();
    const eventEmitter = new EventEmitter<MyEvent>();
    eventEmitter.addListener(listener);
    eventEmitter.addListener(listener);
    eventEmitter.addListener(listener);

    eventEmitter.emit(irrelevantEvent);

    expect(listener).toHaveBeenCalledTimes(3);
  });

  it("should remove a given listener", () => {
    const listenerA = vi.fn();
    const listenerB = vi.fn();
    const eventEmitter = new EventEmitter<MyEvent>();
    eventEmitter.addListener(listenerA);
    eventEmitter.addListener(listenerB);

    eventEmitter.removeListener(listenerB);

    eventEmitter.emit(irrelevantEvent);
    expect(listenerA).toHaveBeenCalled();
    expect(listenerB).not.toHaveBeenCalled();
  });

  it("should return a `removeListener` function when a listener is added", () => {
    const listener = vi.fn();
    const eventEmitter = new EventEmitter<MyEvent>();
    const removeListener = eventEmitter.addListener(listener);

    removeListener();

    eventEmitter.emit(irrelevantEvent);
    expect(listener).not.toHaveBeenCalled();
  });

  it("should only remove the first occurance of the given listener", () => {
    const listener = vi.fn();
    const eventEmitter = new EventEmitter<MyEvent>();
    eventEmitter.addListener(listener);
    eventEmitter.addListener(listener);
    eventEmitter.addListener(listener);

    eventEmitter.removeListener(listener);

    eventEmitter.emit(irrelevantEvent);
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
