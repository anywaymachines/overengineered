import GlobalInputHandler from "./GlobalInputHandler";
import { ISignalWrapper, ThinSignalWrapper } from "./SignalWrapper";

type InputCallback = (input: InputObject, gameProcessedEvent: boolean) => void;
type TouchCallback = (inputPositions: readonly Vector2[], gameProcessedEvent: boolean) => void;

const filterKeyboard = (callback: InputCallback): InputCallback => {
	return (input, gameProcessedEvent) => {
		if (gameProcessedEvent) return;
		if (input.UserInputType !== Enum.UserInputType.Keyboard) return;
		callback(input, gameProcessedEvent);
	};
};
const filterMouse1 = (callback: InputCallback): InputCallback => {
	return (input, gameProcessedEvent) => {
		if (gameProcessedEvent) return;
		if (input.UserInputType !== Enum.UserInputType.MouseButton1) return;
		callback(input, gameProcessedEvent);
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

			for (const [_, events] of eventmap) {
				for (const event of events) {
					event(input, gameProcessedEvent);
				}
			}
		});
	};
	subKeys(inputBegan, keyPressed);
	subKeys(inputEnded, keyReleased);
}

export default class InputHandler {
	private inputBegan?: ThinSignalWrapper<Parameters<InputCallback>>;
	private inputChanged?: ThinSignalWrapper<Parameters<InputCallback>>;
	private inputEnded?: ThinSignalWrapper<Parameters<InputCallback>>;
	private touchTap?: ThinSignalWrapper<Parameters<TouchCallback>>;

	onInputBegan(callback: InputCallback) {
		(this.inputBegan ??= new ThinSignalWrapper(inputBegan)).subscribe(callback);
	}
	onInputChanged(callback: InputCallback) {
		(this.inputChanged ??= new ThinSignalWrapper(inputChanged)).subscribe(callback);
	}
	onInputEnded(callback: InputCallback) {
		(this.inputEnded ??= new ThinSignalWrapper(inputEnded)).subscribe(callback);
	}
	onTouchTap(callback: TouchCallback) {
		(this.touchTap ??= new ThinSignalWrapper(touchTap)).subscribe(callback);
	}

	onKeysDown(callback: InputCallback) {
		this.onInputBegan(filterKeyboard(callback));
	}
	onKeyDown(key: KeyCode, callback: InputCallback) {
		let map = keyPressed.get(key);
		if (!map) keyPressed.set(key, (map = new Map()));
		maps.add(map);

		let selfmap = map.get(this);
		if (!selfmap) map.set(this, (selfmap = []));

		selfmap.push(callback);
	}
	onKeysUp(callback: InputCallback) {
		this.onInputEnded(filterKeyboard(callback));
	}
	onKeyUp(key: KeyCode, callback: InputCallback) {
		let map = keyReleased.get(key);
		if (!map) keyReleased.set(key, (map = new Map()));
		maps.add(map);

		let selfmap = map.get(this);
		if (!selfmap) map.set(this, (selfmap = []));

		selfmap.push(callback);
	}

	onMouse1Down(callback: InputCallback) {
		this.onInputBegan(filterMouse1(callback));
	}
	onMouse1Up(callback: InputCallback) {
		this.onInputEnded(filterMouse1(callback));
	}

	unsubscribeAll() {
		for (const map of maps) {
			map.delete(this);
		}
	}

	destroy() {
		this.unsubscribeAll();

		this.inputBegan?.destroy();
		this.inputChanged?.destroy();
		this.inputEnded?.destroy();
	}
}
