import { Control } from "client/gui/Control";
import { TextButtonDefinition } from "client/gui/controls/Button";
import { Element } from "shared/Element";

export type WikiCategoriesControlDefinition = GuiObject & {
	readonly ScrollingFrame: ScrollingFrame & {
		readonly Template: TextButtonDefinition & {
			readonly Subgroups: GuiObject;
		};
	};
};
export class WikiCategoriesControl extends Control<WikiCategoriesControlDefinition> {
	constructor(gui: WikiCategoriesControlDefinition) {
		super(gui);
	}
}

export type WikiContentControlDefinition = GuiObject & {
	readonly ScrollingFrame: ScrollingFrame & {
		readonly StringTemplate: TextLabel;
	};
};
export class WikiContentControl extends Control<WikiContentControlDefinition> {
	private readonly contents;
	private readonly stringTemplate;

	constructor(gui: WikiContentControlDefinition) {
		super(gui);

		this.contents = this.add(new Control(gui.ScrollingFrame));
		this.stringTemplate = this.asTemplate(gui.ScrollingFrame.StringTemplate, true);
	}

	contentFromEntry(entry: WikiEntryContent): Control {
		if (typeIs(entry, "string")) {
			const gui = this.stringTemplate();
			gui.Text = entry;

			return new Control(gui);
		}

		// empty
		return new Control(Element.create("Frame", { Transparency: 1 }));
	}

	set(entry: WikiEntry) {
		this.contents.clear();

		for (const part of entry.content) {
			this.contents.add(this.contentFromEntry(part));
		}
	}
}
