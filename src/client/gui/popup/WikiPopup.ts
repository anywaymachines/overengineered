import { Gui } from "client/gui/Gui";
import { Popup } from "client/gui/Popup";
import { ButtonControl } from "client/gui/controls/Button";
import {
	WikiCategoriesControl,
	WikiCategoriesControlDefinition,
	WikiContentControl,
	WikiContentControlDefinition,
} from "client/wiki/WikiControl";

export type WikiPopupDefinition = GuiObject & {
	readonly Heading: Frame & {
		readonly CloseButton: TextButton;
		readonly TitleLabel: TextLabel;
	};
	readonly Content: GuiObject & {
		readonly Categories: WikiCategoriesControlDefinition;
		readonly Content: WikiContentControlDefinition;
	};
};

export class WikiPopup extends Popup<WikiPopupDefinition> {
	static showPopup() {
		const popup = new WikiPopup(Gui.getGameUI<{ Popup: { Wiki: WikiPopupDefinition } }>().Popup.Wiki.Clone());

		popup.show();
	}
	constructor(gui: WikiPopupDefinition) {
		super(gui);

		this.add(new ButtonControl(gui.Heading.CloseButton, () => this.hide()));

		const sidebar = this.add(new WikiCategoriesControl(gui.Content.Categories));
		const content = this.add(new WikiContentControl(gui.Content.Content));

		content.set({
			title: "Block",
			tags: new ReadonlySet(["block"]),
			content: [
				`
==General==
Block is a **block** of *a very* ***blockness*** ~~and nothing else~~
`,
			],
		});
	}
}
