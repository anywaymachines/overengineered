import Scene from "client/base/Scene";
import ToolbarWidget from "../widget/ToolbarWidget";
import GuiController from "client/controller/GuiController";
import ToolInfoWidget from "../widget/ToolInfoWidget";

export default class BuildScene extends Scene {
	toolbarWidget: ToolbarWidget;
	toolInfoWidget: ToolInfoWidget;

	constructor() {
		super();

		// Widgets
		const gameUI = GuiController.getGameUI();
		this.toolbarWidget = this.addWidget(new ToolbarWidget(gameUI.Toolbar));
		this.toolInfoWidget = this.addWidget(new ToolInfoWidget(gameUI.ToolInfo));
	}

	showScene(hasAnimations: boolean): void {
		// Widgets
		this.toolbarWidget.showWidget(hasAnimations);
		this.toolInfoWidget.showWidget(hasAnimations);
	}

	hideScene(hasAnimations: boolean): void {
		// Widgets
		this.toolbarWidget.hideWidget(hasAnimations);
		this.toolInfoWidget.hideWidget(hasAnimations);
	}
}
