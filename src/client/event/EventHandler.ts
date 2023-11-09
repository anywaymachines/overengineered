/** Killable EventHandler for roblox connections */
export default class EventHandler {
	private events: RBXScriptConnection[] = [];

	/** The function of registering an event
	 * @param signal A signal. Example: `UserInputService.InputChanged`
	 * @param callback Callback
	 */
	public subscribe(signal: RBXScriptSignal, callback: Callback): number {
		return this.events.push(signal.Connect((_) => callback(_)));
	}

	public subscribeOnce(signal: RBXScriptSignal, callback: Callback): number {
		return this.events.push(signal.Once((_) => callback(_)));
	}

	public size(): number {
		return this.events.size();
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
