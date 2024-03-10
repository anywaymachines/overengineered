import { ReadonlySignal } from "shared/event/Signal";

/** Killable EventHandler for roblox connections */
export default class EventHandler {
	private readonly events: { Disconnect(): void }[] = [];

	/** The function of registering an event
	 * @param signal A signal. Example: `UserInputService.InputChanged`
	 * @param callback Callback
	 */
	subscribe<T extends Callback = Callback>(signal: ReadonlySignal<T>, callback: T) {
		this.events.push(signal.Connect(callback));
	}

	/** The function of registering an event once
	 * @param signal A signal. Example: `UserInputService.InputChanged`
	 * @param callback Callback
	 */
	subscribeOnce<T extends Callback = Callback>(signal: RBXScriptSignal<T>, callback: T) {
		this.events.push(signal.Once(callback));
	}

	/** Deletes and disables all events */
	unsubscribeAll() {
		for (const event of this.events) {
			event.Disconnect();
		}

		this.events.clear();
	}
}
