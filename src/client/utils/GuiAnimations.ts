import { TweenService } from "@rbxts/services";

export default class GuiAnimations {
	public static fade(frame: GuiObject, duration: number, direction?: "right" | "left" | "up" | "down") {
		const defaultPosition = frame.Position;
		let offsetPosition;

		switch (direction) {
			case "left":
				offsetPosition = new UDim2(frame.Size.X.Scale * 0.5, frame.Size.X.Offset * 0.5, 0, 0);
				offsetPosition = defaultPosition.add(offsetPosition);
				break;
			case "right":
				offsetPosition = new UDim2(frame.Size.X.Scale * 0.5, frame.Size.X.Offset * 0.5, 0, 0);
				offsetPosition = defaultPosition.sub(offsetPosition);
				break;
			case "down":
				offsetPosition = new UDim2(0, 0, frame.Size.Y.Scale * 0.5, frame.Size.Y.Offset * 0.5);
				offsetPosition = defaultPosition.sub(offsetPosition);
				break;
			case "up":
				offsetPosition = new UDim2(0, 0, frame.Size.Y.Scale * 0.5, frame.Size.Y.Offset * 0.5);
				offsetPosition = defaultPosition.add(offsetPosition);
				break;
			default:
				return;
		}

		frame.Position = offsetPosition;
		frame.TweenPosition(defaultPosition, Enum.EasingDirection.In, Enum.EasingStyle.Linear, duration);
	}

	public static tweenTransparency(gui: GuiObject, transparency: number, time: number) {
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

	public static multiTweenTransparency(gui: GuiObject, transparency: number, time: number) {
		const desc = gui.GetDescendants();
		desc.push(gui);
		for (let i = 0; i < desc.size(); i++) {
			const child = desc[i];
			if (child.IsA("GuiObject")) {
				if (child.Transparency === transparency) {
					continue;
				}
				this.tweenTransparency(child, transparency, time);
			}
		}
	}

	public static tweenColor(gui: GuiObject, color: Color3, time: number) {
		const info = { BackgroundColor3: color } as Partial<ExtractMembers<GuiBase, Tweenable>>;
		const tween = TweenService.Create(gui, new TweenInfo(time), info);
		tween.Play();
	}
}
