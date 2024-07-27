import type { ReadonlyArgsSignal } from "shared/event/Signal";

/** Killable EventHandler for roblox connections */
export class EventHandler {
	private readonly events: SignalConnection[] = [];

	/** Register an event
	 * @param signal A signal. Example: `UserInputService.InputChanged`
	 * @param callback Callback
	 */
	subscribe<TArgs extends unknown[]>(signal: ReadonlyArgsSignal<TArgs>, callback: (...args: TArgs) => void) {
		this.events.push(signal.Connect(callback));
	}

	/** Register an event once
	 * @param signal A signal. Example: `UserInputService.InputChanged`
	 * @param callback Callback
	 */
	subscribeOnce<TArgs extends unknown[]>(
		signal: RBXScriptSignal<(...args: TArgs) => void>,
		callback: (...args: TArgs) => void,
	) {
		this.events.push(signal.Once(callback));
	}

	/** Register a disconnectable object */
	register(disconnectable: SignalConnection) {
		this.events.push(disconnectable);
	}

	/** Deletes and disables all events */
	unsubscribeAll() {
		for (const event of this.events) {
			event.Disconnect();
		}

		this.events.clear();
	}
}
