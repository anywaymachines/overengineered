import Control from "client/base/Control";

export type TabControlDefinition = Frame & {
	Tabs: ScrollingFrame & {
		Template: GuiButton & {
			Text: TextLabel;
		};
	};
	Contents: Frame & {};
};

export default class TabControl extends Control<TabControlDefinition> {
	private readonly tabTemplate;

	constructor(gui: TabControlDefinition) {
		super(gui);

		this.tabTemplate = this.gui.Tabs.Template.Clone();
		this.gui.Tabs.ClearAllChildren();
	}

	addTab(name: string, content: Control<Frame>) {
		const tab = this.tabTemplate.Clone();
		tab.Text.Text = name;
		tab.Visible = true;
		tab.Parent = this.gui.Tabs;

		this.addChild(content);
		content.setVisible(false);
		content.setParent(this.gui.Contents);

		this.eventHandler.subscribe(tab.Activated, (input, clickCount) => {
			this.gui.Contents.ClearAllChildren();
			content.setParent(this.gui.Contents);
		});
	}
}
