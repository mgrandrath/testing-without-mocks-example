import { describe, expect, it, vi } from "vitest";
import { EventEmitter } from "./event-emitter";

describe("EventEmitter", () => {
  it("should call all listeners with the emitted event", () => {
    type MyEvent = {
      myProp: string;
    };
    const listenerA = vi.fn();
    const listenerB = vi.fn();
    const eventEmitter = new EventEmitter<MyEvent>();
    eventEmitter.addListener(listenerA);
    eventEmitter.addListener(listenerB);
    const myEvent = { myProp: "My Value" };

    eventEmitter.emit(myEvent);

    expect(listenerA).toHaveBeenCalledWith(myEvent);
    expect(listenerB).toHaveBeenCalledWith(myEvent);
  });

  it("should call a listener multiple times when it has been added multiple times", () => {
    const listener = vi.fn();
    const eventEmitter = new EventEmitter<string>();
    eventEmitter.addListener(listener);
    eventEmitter.addListener(listener);
    eventEmitter.addListener(listener);

    eventEmitter.emit("test");

    expect(listener).toHaveBeenCalledTimes(3);
  });

  it("should remove a given listener", () => {
    const listenerA = vi.fn();
    const listenerB = vi.fn();
    const eventEmitter = new EventEmitter<string>();
    eventEmitter.addListener(listenerA);
    eventEmitter.addListener(listenerB);

    eventEmitter.removeListener(listenerB);

    eventEmitter.emit("test");
    expect(listenerA).toHaveBeenCalled();
    expect(listenerB).not.toHaveBeenCalled();
  });

  it("should return a `removeListener` function when a listener is added", () => {
    const listener = vi.fn();
    const eventEmitter = new EventEmitter<string>();
    const removeListener = eventEmitter.addListener(listener);

    removeListener();

    eventEmitter.emit("test");
    expect(listener).not.toHaveBeenCalled();
  });

  it("should only remove the first occurance of the given listener", () => {
    const listener = vi.fn();
    const eventEmitter = new EventEmitter<string>();
    eventEmitter.addListener(listener);
    eventEmitter.addListener(listener);
    eventEmitter.addListener(listener);

    eventEmitter.removeListener(listener);

    eventEmitter.emit("test");
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
