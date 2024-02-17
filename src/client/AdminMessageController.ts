import Remotes from "shared/Remotes";
import { Colors } from "./gui/Colors";
import { Element } from "./gui/Element";
import Gui from "./gui/Gui";
import GuiAnimator from "./gui/GuiAnimator";

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
} as const;
