import Control from "client/base/Control";

export type TabControlDefinition = Frame & {
	Tabs: ScrollingFrame & {
		Template: TextButton & {};
	};
	Content: Frame & {};
};

export default class TabControl extends Control<TabControlDefinition> {
	private readonly tabTemplate;

	constructor(gui: TabControlDefinition) {
		super(gui);
		this.tabTemplate = Control.asTemplate(this.gui.Tabs.Template);
	}

	addTab(name: string, content: Control<GuiObject>) {
		const tab = this.tabTemplate();
		tab.Text = name;
		tab.Visible = true;
		tab.Parent = this.gui.Tabs;

		this.add(content);
		content.setParent(this.gui.Content);
		content.setVisible(this.gui.Content.GetChildren().size() === 0);

		this.event.subscribe(tab.MouseButton1Click, () => {
			for (const child of this.gui.Content.GetChildren()) {
				if ("Visible" in child) child.Visible = false;
			}

			content.setVisible(true);
		});
	}
}
