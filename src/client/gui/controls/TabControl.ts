import Control from "client/base/Control";

type BlockChooserDefinition = Frame & {
	TabTemplate: GuiButton & {
		Text: TextLabel;
	};
	TabContentsTemplate: ScrollingFrame & {};

	Tabs: ScrollingFrame & {};
	Contents: Frame & {};
};

export default class TabControl extends Control<BlockChooserDefinition> {
	private readonly tabTemplate;
	private readonly contentsTemplate;

	private currentContent?: Control<Frame>;

	constructor(gui: BlockChooserDefinition) {
		super(gui);
		this.tabTemplate = this.gui.TabTemplate.Clone();
		this.contentsTemplate = this.gui.TabContentsTemplate.Clone();
	}

	addTab(name: string, content: Control<Frame>) {
		const tab = this.tabTemplate.Clone();
		tab.Text.Text = name;
		tab.Visible = true;
		tab.Parent = this.gui.Tabs;

		content.gui.Visible = false;
		content.gui.Parent = this.gui.Contents;

		tab.InputBegan;
	}
}
