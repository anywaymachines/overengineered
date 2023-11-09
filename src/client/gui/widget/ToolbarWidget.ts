import ToolBase from "client/base/ToolBase";
import Widget from "client/base/Widget";
import GuiController from "client/controller/GuiController";
import BuildTool from "client/tools/BuildTool";
import MoveTool from "client/tools/MoveTool";

export default class ToolbarWidget extends Widget {
	private tools: ToolBase[] = [];

	constructor(frame: Toolbar) {
		super(frame);

		// Creating tools
		this.tools.push(new BuildTool());
		this.tools.push(new MoveTool());

		// Preparation
		const gameUI = GuiController.getGameUI();
		const template = gameUI.Toolbar.Buttons.Template.Clone();

		// Creating buttons
		let i = 1;
		this.tools.forEach((tool) => {
			const button = template.Clone();
			button.ImageLabel.Image = tool.getImageID();
			button.KeyboardNumberLabel.Text = tostring(i);
			button.Parent = frame.Buttons;
			i++;
		});

		// Remove template
		gameUI.Toolbar.Buttons.Template.Destroy();
	}

	showWidget(hasAnimations: boolean): void {
		this.frame.Visible = true;
	}
	hideWidget(hasAnimations: boolean): void {
		super.hideWidget(hasAnimations);

		this.frame.Visible = false;
	}
}
