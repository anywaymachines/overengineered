import { Element } from "shared/Element";
import { Remotes } from "shared/Remotes";
import { Colors } from "./gui/Colors";
import { Control } from "./gui/Control";
import { Gui } from "./gui/Gui";
import { GuiAnimator } from "./gui/GuiAnimator";
import { TextButtonControl } from "./gui/controls/Button";
import { TextBoxControl } from "./gui/controls/TextBoxControl";

Remotes.Client.GetNamespace("Admin")
	.Get("SendMessage")
	.Connect((text, color, duration) => {
		const label = Element.create("TextLabel", {
			Text: text,
			BackgroundTransparency: 1,
			Size: new UDim2(1, 0, 1, 0),
			TextScaled: true,
			TextColor3: color ?? Colors.red,
			Parent: Gui.getGameUI(),
		});

		GuiAnimator.transition(label, 0.33, "down");
		task.delay(duration ?? 3, () => {
			GuiAnimator.hide(label, 0.33, "up");
			task.delay(0.33, () => label.Destroy());
		});
	});

export namespace AdminMessageController {
	// empty method to trigger subscription
	export function initialize() {}

	export function send(text: string, color?: Color3, duration?: number) {
		Remotes.Client.GetNamespace("Admin").Get("SendMessage").SendToServer(text, color, duration);
	}

	export function createControl() {
		const tb = new TextBoxControl(
			Element.create("TextBox", { Size: new UDim2(0, 500, 0, 30), ClearTextOnFocus: false, AutoLocalize: false }),
		);

		return new Control(
			Element.create(
				"Frame",
				{ Size: new UDim2(1, 0, 1, 0), BackgroundTransparency: 1 },
				{
					list: Element.create("UIListLayout", {
						FillDirection: Enum.FillDirection.Vertical,
						SortOrder: Enum.SortOrder.LayoutOrder,
					}),
				},
			),
		)
			.withAdded(
				TextButtonControl.create({ Text: "test", Size: new UDim2(0, 100, 0, 30) }, () =>
					AdminMessageController.send("MESSAGE TEST THIS IS A WARNING\nNOT"),
				),
			)
			.withAdded(
				TextButtonControl.create({ Text: "restart", Size: new UDim2(0, 100, 0, 30) }, () =>
					AdminMessageController.send("Server restart\nSave your builds"),
				),
			)
			.withAdded(tb)
			.withAdded(
				TextButtonControl.create({ Text: "custom", Size: new UDim2(0, 100, 0, 30) }, () =>
					AdminMessageController.send(tb.text.get()),
				),
			);
	}
}
