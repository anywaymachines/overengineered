import { TweenService } from "@rbxts/services";

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
		frame.TweenPosition(newPosition, Enum.EasingDirection.Out, Enum.EasingStyle.Quad, duration);
	}

	/** Animation for changing GUI colors */
	static tweenColor(gui: GuiObject, color: Color3, time: number) {
		const info = { BackgroundColor3: color } as Partial<ExtractMembers<GuiBase, Tweenable>>;
		const tween = TweenService.Create(gui, new TweenInfo(time), info);
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

		const tween = TweenService.Create(gui, new TweenInfo(time), info);
		tween.Play();
	}

	static tween<T extends GuiObject>(gui: T, values: Partial<ExtractMembers<T, Tweenable>>, info: TweenInfo) {
		const tween = TweenService.Create(gui, info, values);
		tween.Play();
	}
}
