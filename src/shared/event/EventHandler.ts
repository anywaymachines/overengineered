import Signal from "@rbxts/signal";

/** Killable EventHandler for roblox connections */
export default class EventHandler {
	public readonly allUnsibscribed = new Signal<() => void>();
	private readonly events: RBXScriptConnection[] = [];

	public size(): number {
		return this.events.size();
	}

	/** The function of registering an event
	 * @param signal A signal. Example: `UserInputService.InputChanged`
	 * @param callback Callback
	 */
	public subscribe<T extends Callback = Callback>(signal: RBXScriptSignal<T>, callback: T): number {
		return this.events.push(signal.Connect(callback));
	}

	/** The function of registering an event once
	 * @param signal A signal. Example: `UserInputService.InputChanged`
	 * @param callback Callback
	 */
	public subscribeOnce<T extends Callback = Callback>(signal: RBXScriptSignal<T>, callback: T): number {
		return this.events.push(signal.Once(callback));
	}

	public unsubscribe(index: number) {
		this.events[index].Disconnect();
		this.events.remove(index);
	}

	/** Deletes and disables all events */
	public unsubscribeAll() {
		for (let i = 0; i < this.events.size(); i++) {
			const event = this.events[i];
			event.Disconnect();
		}

		this.events.clear();
	}
}
