import { BlockPreviewControl } from "client/gui/buildmode/BlockPreviewControl";
import { Control } from "client/gui/Control";
import { TextButtonControl } from "client/gui/controls/Button";
import { Dropdown } from "client/gui/controls/Dropdown";
import { Element } from "shared/Element";
import { ArgsSignal } from "shared/event/Signal";
import type { TextButtonDefinition } from "client/gui/controls/Button";
import type { DropdownDefinition } from "client/gui/controls/Dropdown";
import type { BlockRegistry } from "shared/block/BlockRegistry";

export type WikiCategoriesControlDefinition = GuiObject & {
	readonly ScrollingFrame: ScrollingFrame & {
		readonly Template: TextButtonDefinition & {
			readonly Subgroups: GuiObject;
		};
	};
};
export class WikiCategoriesControl extends Control<WikiCategoriesControlDefinition> {
	private readonly _clicked = new ArgsSignal<[id: string]>();
	readonly clicked = this._clicked.asReadonly();
	private readonly itemTemplate;
	private readonly list;

	constructor(gui: WikiCategoriesControlDefinition) {
		super(gui);

		this.itemTemplate = this.asTemplate(gui.ScrollingFrame.Template, true);
		this.list = this.add(new Control(gui.ScrollingFrame));
	}

	addItems(items: readonly { readonly id: string; readonly title: string }[]) {
		for (const { id, title } of items) {
			const control = this.list.add(new TextButtonControl(this.itemTemplate(), () => this._clicked.Fire(id)));
			control.text.set(title);
		}
	}
}

export type WikiContentControlDefinition = GuiObject & {
	readonly ScrollingFrame: ScrollingFrame & {
		readonly ContentsTemplate: DropdownDefinition & {
			readonly Content: GuiObject & {
				readonly Template: TextButtonDefinition & {};
			};
		};
		readonly StringTemplate: TextLabel;
		readonly BlockPreviewTemplate: ViewportFrame;
	};
};

type h2 = { readonly name: string };
type h1 = h2 & { readonly h2s: h2[] };
type ContentContext = {
	readonly h1s: h1[];
};

@injectable
export class WikiContentControl extends Control<WikiContentControlDefinition> {
	private readonly contents;
	private readonly contentsItemTemplate;
	private readonly contentsTemplate;
	private readonly stringTemplate;
	private readonly blockPreviewTemplate;

	constructor(
		gui: WikiContentControlDefinition,
		@inject private readonly blockRegistry: BlockRegistry,
	) {
		super(gui);

		this.contents = this.add(new Control(gui.ScrollingFrame));
		this.contentsItemTemplate = this.asTemplate(gui.ScrollingFrame.ContentsTemplate.Content.Template, true);
		this.contentsTemplate = this.asTemplate(gui.ScrollingFrame.ContentsTemplate, true);
		this.stringTemplate = this.asTemplate(gui.ScrollingFrame.StringTemplate, true);
		this.blockPreviewTemplate = this.asTemplate(gui.ScrollingFrame.BlockPreviewTemplate, true);
	}

	private createContentsEntry(h1s: readonly h1[]): Control {
		const dropdown = new Dropdown(this.contentsTemplate());

		for (const h1 of h1s) {
			const gui = dropdown.contents.add(
				new TextButtonControl(this.contentsItemTemplate(), () => {
					print("clicked", h1.name);
				}),
			);
			gui.text.set(h1.name);
		}

		// this.contents.instance.CanvasPosition
		return dropdown;
	}
	private contentFromEntries(entries: readonly WikiEntryContent[]): readonly Control[] {
		const controls: Control[] = [];
		const context: ContentContext = { h1s: [] };

		for (const part of entries) {
			controls.push(this.contentFromEntry(part, context));
		}

		if (context.h1s.size() !== 0) {
			controls.insert(0, this.createContentsEntry(context.h1s));
		}

		return controls;
	}
	private contentFromEntry(entry: WikiEntryContent, context: ContentContext): Control {
		if (typeIs(entry, "string")) {
			const gui = this.stringTemplate();
			gui.Text = entry
				.trim()
				.gsub("<h1>", `<font size="50">`)[0]
				.gsub("</h1>", `</font>`)[0]
				.gsub("<h2>", `<font size="44">`)[0]
				.gsub("</h2>", `</font>`)[0];

			return new Control(gui);
		}
		if (typeIs(entry, "table")) {
			if (entry.type === "blockPreview") {
				return new BlockPreviewControl(
					this.blockPreviewTemplate(),
					this.blockRegistry.blocks.get(entry.id)!.model,
				);
			}
			if (entry.type === "h1") {
				context.h1s.push({ name: entry.name, h2s: [] });
				return this.contentFromEntry(
					`<font color="#989898">${context.h1s.size()}.</font> <h1>${entry.name}</h1>`,
					context,
				);
			}
			if (entry.type === "h2") {
				if (context.h1s.size() === 0) {
					throw "Not enough h1s for h2";
				}

				const h1 = context.h1s[context.h1s.size() - 1];
				h1.h2s.push({ name: entry.name });
				return this.contentFromEntry(
					`<font color="#989898">${context.h1s.size()}.${h1.h2s.size()}.</font> <h2>${entry.name}</h2>`,
					context,
				);
			}
		}

		// empty
		return new Control(Element.create("Frame", { Transparency: 1 }));
	}

	set(entry: WikiEntry) {
		this.contents.clear();

		for (const content of this.contentFromEntries(entry.content)) {
			this.contents.add(content);
		}
	}
}
