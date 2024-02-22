import { Element } from "shared/Element";
import Remotes from "shared/Remotes";
import { Colors } from "./gui/Colors";
import Control from "./gui/Control";
import Gui from "./gui/Gui";
import GuiAnimator from "./gui/GuiAnimator";
import { TextButtonControl } from "./gui/controls/Button";
import TextBoxControl from "./gui/controls/TextBoxControl";

Remotes.Client.GetNamespace("Admin")
	.Get("SendMessage")
	.Connect((text) => {
		const label = Element.create("TextLabel", {
			Text: text,
			BackgroundTransparency: 1,
			Size: new UDim2(1, 0, 1, 0),
			TextScaled: true,
			TextColor3: Colors.red,
			Parent: Gui.getGameUI(),
		});

		GuiAnimator.transition(label, 0.33, "down");
		task.delay(3, () => {
			GuiAnimator.hide(label, 0.33, "down");
			task.delay(0.33, () => label.Destroy());
		});
	});

export const AdminMessageController = {
	// empty method to trigger subscription
	initialize() {},

	send(text: string) {
		Remotes.Client.GetNamespace("Admin").Get("SendMessage").SendToServer(text);
	},

	createControl: () => {
		const tb = new TextBoxControl(
			Element.create("TextBox", { Size: new UDim2(0, 500, 0, 30), AutoLocalize: false }),
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
	},
} as const;
