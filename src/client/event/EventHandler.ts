/** Killable EventHandler for roblox connections */
export default class EventHandler {
	private events: RBXScriptConnection[] = [];

	/** The function of registering an event
	 * @param signal A signal. Example: `UserInputService.InputChanged`
	 * @param callback Callback
	 */
	public registerEvent(signal: RBXScriptSignal, callback: Callback): void {
		this.events.push(signal.Connect((_) => callback(_)));
	}

	/** Deletes and disables all events */
	public killAll() {
		for (let i = 0; i < this.events.size(); i++) {
			const event = this.events[i];
			event.Disconnect();
		}

		this.events.clear();
	}
}
