import GlobalInputHandler from "client/event/GlobalInputHandler";
import { ISignalWrapper, ThinSignalWrapper } from "client/event/SignalWrapper";

type InputCallback = (input: InputObject) => void;
type FullInputCallback = (input: InputObject, gameProcessedEvent: boolean) => void;
type TouchCallback = (inputPositions: readonly Vector2[], gameProcessedEvent: boolean) => void;

const filterKeyboard = (callback: InputCallback, allowGameProcessedEvents: boolean): FullInputCallback => {
	return (input, gameProcessedEvent) => {
		if (!allowGameProcessedEvents && gameProcessedEvent) return;
		if (input.UserInputType !== Enum.UserInputType.Keyboard) return;
		callback(input);
	};
};
const filterMouse1 = (callback: InputCallback, allowGameProcessedEvents: boolean): FullInputCallback => {
	return (input, gameProcessedEvent) => {
		if (!allowGameProcessedEvents && gameProcessedEvent) return;
		if (input.UserInputType !== Enum.UserInputType.MouseButton1) return;
		callback(input);
	};
};
const filterMouse2 = (callback: InputCallback, allowGameProcessedEvents: boolean): FullInputCallback => {
	return (input, gameProcessedEvent) => {
		if (!allowGameProcessedEvents && gameProcessedEvent) return;
		if (input.UserInputType !== Enum.UserInputType.MouseButton2) return;
		callback(input);
	};
};
const filterMouse3 = (callback: InputCallback, allowGameProcessedEvents: boolean): FullInputCallback => {
	return (input, gameProcessedEvent) => {
		if (!allowGameProcessedEvents && gameProcessedEvent) return;
		if (input.UserInputType !== Enum.UserInputType.MouseButton3) return;
		callback(input);
	};
};

const keyPressed = new Map<KeyCode, Map<InputHandler, Callback[]>>();
const keyReleased = new Map<KeyCode, Map<InputHandler, Callback[]>>();
const maps = new Set<Map<InputHandler, Callback[]>>();

const inputBegan = GlobalInputHandler.inputBegan;
const inputChanged = GlobalInputHandler.inputChanged;
const inputEnded = GlobalInputHandler.inputEnded;
const touchTap = GlobalInputHandler.touchTap;

{
	const subKeys = (
		signal: ISignalWrapper<[input: InputObject, gameProcessedEvent: boolean]>,
		map: ReadonlyMap<KeyCode, Map<InputHandler, Callback[]>>,
	) => {
		signal.subscribe((input, gameProcessedEvent) => {
			if (gameProcessedEvent) return;
			if (input.KeyCode === Enum.KeyCode.Unknown) return;

			const eventmap = map.get(input.KeyCode.Name);
			if (!eventmap) return;

			for (const [_, events] of [...eventmap]) {
				for (const event of [...events]) {
					event(input, gameProcessedEvent);
				}
			}
		});
	};
	subKeys(inputBegan, keyPressed);
	subKeys(inputEnded, keyReleased);
}

export type ReadonlyInputHandler = Pick<InputHandler, Exclude<keyof InputHandler, "destroy" | "unsubscribeAll">>;
export default class InputHandler {
	private inputBegan?: ThinSignalWrapper<Parameters<FullInputCallback>>;
	private inputChanged?: ThinSignalWrapper<Parameters<FullInputCallback>>;
	private inputEnded?: ThinSignalWrapper<Parameters<FullInputCallback>>;
	private touchTap?: ThinSignalWrapper<Parameters<TouchCallback>>;

	onInputBegan(callback: FullInputCallback) {
		(this.inputBegan ??= new ThinSignalWrapper(inputBegan)).subscribe(callback);
	}
	onInputChanged(callback: FullInputCallback) {
		(this.inputChanged ??= new ThinSignalWrapper(inputChanged)).subscribe(callback);
	}
	onInputEnded(callback: FullInputCallback) {
		(this.inputEnded ??= new ThinSignalWrapper(inputEnded)).subscribe(callback);
	}
	onTouchTap(callback: TouchCallback, allowGameProcessedEvents = true) {
		if (!allowGameProcessedEvents) {
			(this.touchTap ??= new ThinSignalWrapper(touchTap)).subscribe((positions, gameProcessedEvent) => {
				if (gameProcessedEvent) return;
				callback(positions, gameProcessedEvent);
			});
		} else {
			(this.touchTap ??= new ThinSignalWrapper(touchTap)).subscribe(callback);
		}
	}

	onKeysDown(callback: InputCallback, allowGameProcessedEvents = true) {
		this.onInputBegan(filterKeyboard(callback, allowGameProcessedEvents));
	}
	onKeyDown(key: KeyCode, callback: InputCallback) {
		let map = keyPressed.get(key);
		if (!map) keyPressed.set(key, (map = new Map()));
		maps.add(map);

		let selfmap = map.get(this);
		if (!selfmap) map.set(this, (selfmap = []));

		selfmap.push(callback);
	}
	onKeysUp(callback: InputCallback, allowGameProcessedEvents = true) {
		this.onInputEnded(filterKeyboard(callback, allowGameProcessedEvents));
	}
	onKeyUp(key: KeyCode, callback: InputCallback) {
		let map = keyReleased.get(key);
		if (!map) keyReleased.set(key, (map = new Map()));
		maps.add(map);

		let selfmap = map.get(this);
		if (!selfmap) map.set(this, (selfmap = []));

		selfmap.push(callback);
	}

	onMouse1Down(callback: InputCallback, allowGameProcessedEvents: boolean) {
		this.onInputBegan(filterMouse1(callback, allowGameProcessedEvents));
	}
	onMouse1Up(callback: InputCallback, allowGameProcessedEvents: boolean) {
		this.onInputEnded(filterMouse1(callback, allowGameProcessedEvents));
	}
	onMouse2Down(callback: InputCallback, allowGameProcessedEvents: boolean) {
		this.onInputBegan(filterMouse2(callback, allowGameProcessedEvents));
	}
	onMouse2Up(callback: InputCallback, allowGameProcessedEvents: boolean) {
		this.onInputEnded(filterMouse2(callback, allowGameProcessedEvents));
	}
	onMouse3Down(callback: InputCallback, allowGameProcessedEvents: boolean) {
		this.onInputBegan(filterMouse3(callback, allowGameProcessedEvents));
	}
	onMouse3Up(callback: InputCallback, allowGameProcessedEvents: boolean) {
		this.onInputEnded(filterMouse3(callback, allowGameProcessedEvents));
	}
	onMouseMove(callback: InputCallback, allowGameProcessedEvents: boolean) {
		this.onInputBegan((input, gameProcessedEvent) => {
			if (!allowGameProcessedEvents && gameProcessedEvent) return;
			if (input.UserInputType !== Enum.UserInputType.MouseMovement) return;
			callback(input);
		});
	}

	unsubscribeAll() {
		this.inputBegan?.unsubscribeAll();
		this.inputChanged?.unsubscribeAll();
		this.inputEnded?.unsubscribeAll();
		this.touchTap?.unsubscribeAll();

		for (const map of maps) {
			map.delete(this);
		}
	}

	destroy() {
		this.unsubscribeAll();

		this.inputBegan?.destroy();
		this.inputChanged?.destroy();
		this.inputEnded?.destroy();
		this.touchTap?.destroy();
	}
}
