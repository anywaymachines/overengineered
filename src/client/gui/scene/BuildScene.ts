import Scene from "client/base/Scene";
import ToolbarWidget from "../widget/ToolbarWidget";
import GuiController from "client/controller/GuiController";
import ToolInfoWidget from "../widget/ToolInfoWidget";

/** Construction mode scene */
export default class BuildScene extends Scene {
	private toolbarWidget: ToolbarWidget;
	private toolInfoWidget: ToolInfoWidget;

	constructor() {
		super();

		// Widgets
		const gameUI = GuiController.getGameUI();
		this.toolbarWidget = this.addWidget(new ToolbarWidget(gameUI.Toolbar));
		this.toolInfoWidget = this.addWidget(new ToolInfoWidget(gameUI.ToolInfo));
	}

	hideScene(hasAnimations: boolean): void {
		// Widgets
		this.toolbarWidget.hideWidget(hasAnimations);
		this.toolInfoWidget.hideWidget(hasAnimations);
	}

	showScene(hasAnimations: boolean): void {
		// Widgets
		this.toolbarWidget.showWidget(hasAnimations);
		this.toolInfoWidget.showWidget(hasAnimations);
	}
}
