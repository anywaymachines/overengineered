import Control from "client/gui/Control";
import { Element } from "shared/Element";
import { ButtonControl } from "./Button";

export type TabControlDefinition = Frame & {
	readonly Tabs: ScrollingFrame & {
		readonly Template: GuiButton;
	};
	readonly Content: Frame;
};
export class TabControl extends Control<TabControlDefinition> {
	private readonly tabs = new Map<string, Control>();

	static createInstance() {
		return Element.create(
			"Frame",
			{
				Size: new UDim2(1, 0, 1, 0),
				Transparency: 1,
			},
			{
				Tabs: Element.create(
					"ScrollingFrame",
					{
						Size: new UDim2(0, 200, 1, 0),
						Transparency: 1,
					},
					{
						list: Element.create("UIListLayout"),
						Template: Element.create("TextButton", { Size: new UDim2(1, 0, 0, 20) }),
					},
				),
				Content: Element.create("Frame", {
					Position: new UDim2(0, 200, 0, 0),
					Size: new UDim2(1, -200, 1, 0),
					Transparency: 1,
				}),
			},
		);
	}
	static create() {
		return new TabControl(this.createInstance());
	}

	private readonly buttonTemplate;

	constructor(gui: TabControlDefinition) {
		super(gui);
		this.buttonTemplate = Control.asTemplate(gui.Tabs.Template);
	}

	addTab(name: string, content: Control) {
		this.tabs.set(name, content);

		content.getGui().Parent = this.gui.Content;
		this.add(content);
		content.hide();

		const button = this.add(new ButtonControl(this.buttonTemplate()));
		button.activated.Connect(() => {
			for (const [_, tab] of this.tabs) {
				tab.hide();
			}

			content.show();
		});
	}
}
