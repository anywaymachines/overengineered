import { TweenService } from "@rbxts/services";
import ComponentEventHolder from "client/component/ComponentEventHolder";
import { ReadonlyObservableValue } from "shared/event/ObservableValue";
import Objects from "shared/fixes/objects";

/** A class created for animating interfaces */
export default class GuiAnimator {
	/** Animation for GUI transition */
	static transition(
		frame: GuiObject,
		duration: number,
		direction: "right" | "left" | "up" | "down",
		power: number = 50,
	) {
		const defaultPosition = frame.Position;
		const offsets = {
			left: new UDim2(0, power, 0, 0),
			right: new UDim2(0, -power, 0, 0),
			down: new UDim2(0, 0, 0, -power),
			up: new UDim2(0, 0, 0, power),
		};

		const offsetPosition = offsets[direction];

		const newPosition = defaultPosition.add(offsetPosition);
		frame.Position = newPosition;
		frame.TweenPosition(defaultPosition, Enum.EasingDirection.Out, Enum.EasingStyle.Quad, duration);
	}

	static hide(frame: GuiObject, duration: number, direction: "right" | "left" | "up" | "down", power: number = 50) {
		const defaultPosition = frame.Position;
		const offsets = {
			left: new UDim2(0, power, 0, 0),
			right: new UDim2(0, -power, 0, 0),
			down: new UDim2(0, 0, 0, -power),
			up: new UDim2(0, 0, 0, power),
		};

		const offsetPosition = offsets[direction];

		const newPosition = defaultPosition.add(offsetPosition);
		if (!frame.TweenPosition(newPosition, Enum.EasingDirection.Out, Enum.EasingStyle.Quad, duration)) return;
		spawn(() => {
			wait(duration);
			frame.Visible = false;
			frame.Position = defaultPosition;
		});
	}

	static tweenPosition(frame: GuiObject, position: UDim2, duration: number) {
		const info = { Position: position };
		const tween = TweenService.Create(
			frame,
			new TweenInfo(duration, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
			info,
		);

		tween.Play();
	}

	static revTransition(
		frame: GuiObject,
		duration: number,
		direction: "right" | "left" | "up" | "down",
		power: number = 50,
	) {
		const defaultPosition = frame.Position;
		const offsets = {
			right: new UDim2(0, power, 0, 0),
			left: new UDim2(0, -power, 0, 0),
			up: new UDim2(0, 0, 0, -power),
			down: new UDim2(0, 0, 0, power),
		};

		const offsetPosition = offsets[direction];

		const newPosition = defaultPosition.add(offsetPosition);
		frame.Position = defaultPosition;
		if (!frame.TweenPosition(newPosition, Enum.EasingDirection.Out, Enum.EasingStyle.Quad, duration)) return;
		task.wait(duration);
		frame.Position = defaultPosition;
	}

	/** Animation for changing GUI colors */
	static tweenColor(gui: GuiObject, color: Color3, time: number) {
		const info = { BackgroundColor3: color } as Partial<ExtractMembers<GuiBase, Tweenable>>;
		const tween = TweenService.Create(
			gui,
			new TweenInfo(time, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
			info,
		);
		tween.Play();
	}

	static tweenTransparency(gui: GuiObject, transparency: number, time: number) {
		let info;
		if (gui.IsA("TextLabel")) {
			info = { TextTransparency: transparency } as Partial<ExtractMembers<GuiBase, Tweenable>>;
		} else if (gui.IsA("ImageLabel")) {
			info = { ImageTransparency: transparency } as Partial<ExtractMembers<GuiBase, Tweenable>>;
		} else {
			info = { Transparency: transparency } as Partial<ExtractMembers<GuiBase, Tweenable>>;
		}

		const tween = TweenService.Create(
			gui,
			new TweenInfo(time, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
			info,
		);
		tween.Play();
	}

	static tween<T extends Instance>(gui: T, values: Partial<ExtractMembers<T, Tweenable>>, info: TweenInfo) {
		const tween = TweenService.Create(gui, info, values);
		tween.Play();

		return tween;
	}

	/**
	 * Subscribes to the observable changed event and tweens the gui when it's changed.
	 * Also immediately sets the properties on prepare.
	 */
	static value<T extends Instance, TValue>(
		event: ComponentEventHolder,
		gui: T,
		value: ReadonlyObservableValue<TValue>,
		converter: (value: TValue) => Partial<ExtractMembers<T, Tweenable>>,
		tweenInfo: TweenInfo,
	) {
		event.onPrepare(() => Objects.assign(gui, converter(value.get())));
		Objects.assign(gui, converter(value.get()));
		event.subscribeObservable(value, (value) => GuiAnimator.tween(gui, converter(value), tweenInfo));
	}
}
