import { TweenService } from "@rbxts/services";

export default class GuiAnimations {
	public static fade(frame: GuiObject, duration: number, direction: "right" | "left" | "top" | "down" | undefined) {
		const defaultPosition = frame.Position;
		let offsetPosition;

		switch (direction) {
			case "right":
				offsetPosition = new UDim2(frame.Size.X.Scale * 0.5, frame.Size.X.Offset * 0.5, 0, 0);
				break;
			case "left":
				offsetPosition = new UDim2(frame.Size.X.Scale * 0.5, frame.Size.X.Offset * 0.5, 0, 0);
				break;
			case "top":
				offsetPosition = new UDim2(0, 0, frame.Size.Y.Scale * 0.5, frame.Size.Y.Offset * 0.5);
				break;
			case "down":
				offsetPosition = new UDim2(0, 0, frame.Size.Y.Scale * 0.5, frame.Size.Y.Offset * 0.5);
				break;
			default:
				return;
		}

		offsetPosition = defaultPosition.add(offsetPosition);

		frame.Position = offsetPosition;
		frame.TweenPosition(defaultPosition, Enum.EasingDirection.In, Enum.EasingStyle.Linear, duration);

		const insideContent = frame.GetDescendants();
		insideContent.push(frame);

		insideContent.forEach((element) => {
			if (element.IsA("GuiObject")) {
				this.tweenTransparency(element, 0, duration);
			}
		});
	}

	public static tweenTransparency(gui: GuiObject, transparency: number, time: number) {
		let info;
		if (gui.IsA("GuiLabel")) {
			info = { TextTransparency: transparency } as Partial<ExtractMembers<GuiBase, Tweenable>>;
		} else {
			info = { Transparency: transparency } as Partial<ExtractMembers<GuiBase, Tweenable>>;
		}

		const tween = TweenService.Create(gui, new TweenInfo(time), info);
		tween.Play();
	}
}
