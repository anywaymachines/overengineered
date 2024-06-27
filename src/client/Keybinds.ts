import { ContextActionService } from "@rbxts/services";
import { ObservableMap } from "shared/event/ObservableMap";
import { Keys } from "shared/fixes/Keys";

type KeybindSubscription = {
	readonly func: (input: InputObject) => void | Enum.ContextActionResult;
	readonly connection: SignalConnection;
};

export type { KeybindRegistration };
class KeybindRegistration {
	private readonly subscriptions = new Set<KeybindSubscription>();
	private keys: Set<KeyCode>;

	constructor(
		readonly action: string,
		readonly displayName: string,
		defaultKeys: readonly KeyCode[],
	) {
		this.keys = new Set(defaultKeys);
	}

	getKeys() {
		return this.keys;
	}
	setKeys(keys: readonly KeyCode[]) {
		this.keys = new Set(keys);
	}

	onDown(func: KeybindSubscription["func"]): SignalConnection {
		return this.on((input) => {
			if (input.UserInputState !== Enum.UserInputState.Begin) return;
			return func(input);
		});
	}
	onUp(func: KeybindSubscription["func"]): SignalConnection {
		return this.on((input) => {
			if (input.UserInputState !== Enum.UserInputState.Begin) return;
			return func(input);
		});
	}
	private on(func: KeybindSubscription["func"]): SignalConnection {
		const { action: name, subscriptions } = this;

		const connection: SignalConnection = {
			Disconnect() {
				ContextActionService.UnbindAction(name);
				subscriptions.delete(sub);
			},
		};
		const sub = { func, connection };
		this.subscriptions.add(sub);

		this.reconnect();
		return connection;
	}

	private reconnect() {
		ContextActionService.UnbindAction(this.action);

		ContextActionService.BindAction(
			this.action,
			(name, state, input) => {
				if (name !== this.action) return;
				for (const { func } of this.subscriptions) {
					const result = func(input);
					if (result === Enum.ContextActionResult.Sink) {
						return result;
					}
				}

				return Enum.ContextActionResult.Pass;
			},
			false,
			...this.keys.map((k) => Keys[k]),
		);
	}
}

export class Keybinds {
	private readonly _registrations = new ObservableMap<string, KeybindRegistration>();
	readonly registrations = this._registrations.asReadonly();

	register(action: string, displayName: string, keys: readonly KeyCode[]): KeybindRegistration {
		let registration = this._registrations.get(action);
		if (!registration) {
			this._registrations.set(action, (registration = new KeybindRegistration(action, displayName, keys)));
		}

		return registration;
	}
}
